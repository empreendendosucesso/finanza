
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
    TrendingUp, TrendingDown, Wallet, Sparkles, Calendar, 
    ChevronLeft, ChevronRight, BrainCircuit, ArrowUpRight, 
    ArrowDownRight, Trash2, Download, Upload, ShieldCheck, Lock,
    Database, FileJson
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- CONSTANTES E TIPOS ---
const TransactionType = { INCOME: 'INCOME', EXPENSE: 'EXPENSE' } as const;
type TTransactionType = typeof TransactionType[keyof typeof TransactionType];

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: TTransactionType;
    category: string;
    date: string;
}

const CATEGORIES = {
    INCOME: ['Salário', 'Investimentos', 'Freelance', 'Presente', 'Outros'],
    EXPENSE: ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Assinaturas', 'Dívidas', 'Outros']
};

const CATEGORY_COLORS: Record<string, string> = {
    'Alimentação': '#f87171', 'Moradia': '#60a5fa', 'Transporte': '#fbbf24',
    'Lazer': '#a78bfa', 'Saúde': '#34d399', 'Educação': '#f472b6',
    'Assinaturas': '#fb923c', 'Dívidas': '#94a3b8', 'Salário': '#10b981',
    'Investimentos': '#3b82f6', 'Freelance': '#8b5cf6', 'Presente': '#ec4899', 'Outros': '#6b7280'
};

// --- SERVIÇO DE IA ---
const getFinancialInsights = async (transactions: Transaction[]) => {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        return "⚠️ Inteligência Artificial desativada: Chave de API não configurada.";
    }

    const ai = new GoogleGenAI({ apiKey });
    const context = transactions.map(t => `- ${t.date}: ${t.description} (${t.category}) = R$ ${t.amount} [${t.type}]`).join('\n');
    const prompt = `Analise o seguinte extrato financeiro mensal e forneça 3 dicas práticas e curtas em português para melhorar a saúde financeira desta pessoa.\nTransações:\n${context}\nSeja direto, use bullet points e linguagem encorajadora.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Erro na Gemini API:", error);
        return "Houve um problema ao gerar os insights. Verifique sua cota da API.";
    }
};

// --- COMPONENTES ---
const TransactionForm = ({ onAdd }: { onAdd: (t: Omit<Transaction, 'id'>) => void }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TTransactionType>(TransactionType.EXPENSE);
    const [category, setCategory] = useState(CATEGORIES.EXPENSE[0]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount) return;
        onAdd({ description, amount: parseFloat(amount), type, category, date });
        setDescription(''); setAmount('');
    };

    const handleTypeChange = (newType: TTransactionType) => {
        setType(newType);
        setCategory(newType === TransactionType.INCOME ? CATEGORIES.INCOME[0] : CATEGORIES.EXPENSE[0]);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Nova Transação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                    <button type="button" onClick={() => handleTypeChange(TransactionType.EXPENSE)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Saída</button>
                    <button type="button" onClick={() => handleTypeChange(TransactionType.INCOME)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Entrada</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (ex: Aluguel)" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" required />
                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Valor R$" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" required />
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                        {(type === TransactionType.INCOME ? CATEGORIES.INCOME : CATEGORIES.EXPENSE).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" required />
                </div>
                <button type="submit" className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 ${type === TransactionType.INCOME ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>Adicionar</button>
            </form>
        </div>
    );
};

const Charts = ({ transactions }: { transactions: Transaction[] }) => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const categoryData = expenses.reduce((acc: any[], t) => {
        const existing = acc.find(item => item.name === t.category);
        if (existing) existing.value += t.amount;
        else acc.push({ name: t.category, value: t.amount });
        return acc;
    }, []);

    const flowData = [{
        name: 'Fluxo',
        Entradas: transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0),
        Saídas: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0),
    }];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[350px]">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Gastos por Categoria</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {categoryData.map((entry, index) => <Cell key={index} fill={CATEGORY_COLORS[entry.name] || '#cbd5e1'} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[350px]">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Entradas vs Saídas</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={flowData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" hide />
                        <YAxis fontSize={12} stroke="#94a3b8" />
                        <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                        <Bar dataKey="Entradas" fill="#10b981" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Saídas" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- APLICAÇÃO PRINCIPAL ---
const App = () => {
    const [transactions, setTransactions] = useState<Transaction[]>(() => 
        JSON.parse(localStorage.getItem('finanza_transactions') || '[]')
    );
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [insights, setInsights] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        localStorage.setItem('finanza_transactions', JSON.stringify(transactions));
    }, [transactions]);

    const filtered = useMemo(() => transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }), [transactions, currentMonth, currentYear]);

    const totals = useMemo(() => filtered.reduce((acc, t) => {
        if (t.type === TransactionType.INCOME) acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
    }, { income: 0, expense: 0 }), [filtered]);

    const handleAdd = (t: Omit<Transaction, 'id'>) => setTransactions(prev => [...prev, { ...t, id: crypto.randomUUID() }]);
    const handleDelete = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
    
    const handleAI = async () => {
        if (filtered.length === 0) return;
        setLoading(true);
        const res = await getFinancialInsights(filtered);
        setInsights(res || '');
        setLoading(false);
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(transactions, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `finanza-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string) as Transaction[];
                if (Array.isArray(imported)) {
                    if (confirm('Atenção: Isso substituirá todos os seus dados atuais. Deseja continuar?')) {
                        setTransactions(imported);
                        if (imported.length > 0) {
                            const dates = imported.map(t => new Date(t.date).getTime());
                            const latestDate = new Date(Math.max(...dates));
                            setTimeout(() => {
                                setCurrentMonth(latestDate.getMonth());
                                setCurrentYear(latestDate.getFullYear());
                                setInsights('');
                                alert('Dados restaurados com sucesso!');
                            }, 10);
                        }
                    }
                }
            } catch (err) { alert('Erro ao processar o backup.'); }
        };
        reader.readAsText(file);
    };

    const changeMonth = (off: number) => {
        let m = currentMonth + off;
        let y = currentYear;
        if (m < 0) { m = 11; y--; }
        else if (m > 11) { m = 0; y++; }
        setCurrentMonth(m); setCurrentYear(y); setInsights('');
    };

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 p-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-200"><Wallet size={20} /></div>
                        <h1 className="text-xl font-bold">Finanza<span className="text-blue-600">AI</span></h1>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-4 bg-slate-100 rounded-xl p-1">
                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white rounded-lg transition-all"><ChevronLeft size={20} /></button>
                            <span className="text-sm font-semibold min-w-[120px] text-center">{monthNames[currentMonth]} {currentYear}</span>
                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white rounded-lg transition-all"><ChevronRight size={20} /></button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 mt-8 flex-grow mb-12 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-400 font-bold uppercase">Entradas</span><TrendingUp className="text-emerald-500" size={18}/></div>
                        <p className="text-2xl font-bold text-emerald-600">R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-400 font-bold uppercase">Saídas</span><TrendingDown className="text-red-500" size={18}/></div>
                        <p className="text-2xl font-bold text-red-600">R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className={`p-6 rounded-2xl border text-white shadow-lg ${totals.income - totals.expense >= 0 ? 'bg-blue-600 border-blue-500' : 'bg-orange-600 border-orange-500'}`}>
                        <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold uppercase opacity-80">Saldo</span><Wallet size={18}/></div>
                        <p className="text-2xl font-bold">R$ {(totals.income - totals.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Charts transactions={filtered} />
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <div className="p-4 bg-slate-50 border-b font-semibold text-slate-700">Histórico de Transações</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead><tr className="bg-slate-50 text-slate-400 uppercase text-[10px]"><th className="p-4">Data</th><th>Descrição</th><th>Cat.</th><th className="text-right p-4">Valor</th><th></th></tr></thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={5} className="p-10 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
                                        ) : filtered.map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50 group">
                                                <td className="p-4 text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                                <td className="font-medium text-slate-700">{t.description}</td>
                                                <td><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{t.category}</span></td>
                                                <td className={`text-right font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <TransactionForm onAdd={handleAdd} />
                        
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Database size={18}/> Backup</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={handleExport} className="py-2 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1 border border-slate-200"><Download size={14}/> Exportar</button>
                                <button onClick={() => fileInputRef.current?.click()} className="py-2 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1 border border-slate-200"><Upload size={14}/> Importar</button>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100">
                            <div className="flex items-center gap-2 mb-4"><BrainCircuit size={24} className="text-indigo-200"/><h3 className="font-bold text-lg">Análise IA</h3></div>
                            {!insights ? (
                                <button onClick={handleAI} disabled={loading || filtered.length === 0} className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-indigo-50 disabled:opacity-50">
                                    {loading ? <div className="w-4 h-4 border-2 border-indigo-700 border-t-transparent animate-spin rounded-full"/> : <><Sparkles size={16}/> Analisar Finanças</>}
                                </button>
                            ) : (
                                <div className="animate-in space-y-4">
                                    <div className="text-sm whitespace-pre-wrap leading-relaxed text-indigo-50 bg-white/10 p-4 rounded-xl border border-white/10 italic">
                                        {insights}
                                    </div>
                                    <button onClick={() => setInsights('')} className="text-xs text-indigo-200 hover:text-white transition-colors">Nova análise</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-slate-200 py-8 px-4 mt-auto">
                <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold"><ShieldCheck className="text-emerald-500" size={20} /> Privacidade Local</div>
                    <p className="text-slate-500 text-xs max-w-lg">Seus dados são salvos apenas no seu navegador. Lembre-se de exportar seu backup periodicamente.</p>
                </div>
            </footer>
        </div>
    );
};

// --- RENDER ---
const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<App />);
}
