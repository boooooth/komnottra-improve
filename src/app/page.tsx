'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import {
  Camera,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Search,
  Download,
  Smartphone,
  Bell,
  Archive as ArchiveIcon,
  FileSpreadsheet,
  Check,
  X,
  FileText,
  Filter,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Video,
  StopCircle,
  Home,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Copy,
  Shield,
  User,
  Receipt,
  Lightbulb,
  Car,
  Store,
  ShoppingBag,
  Coffee,
  Save,
  Link as LinkIcon,
  Zap,
  Menu,
  Sparkles,
  Trash2,
  Loader2,
  Plus,
  Tag,
  FolderTree,
  CheckCheck,
  Maximize2,
  ExternalLink,
  SplitSquareVertical,
  Edit3,
  ArrowRight,
  Rocket,
  ZoomIn,
  ZoomOut,
  BarChart3,
  LineChart,
  DollarSign,
  Send,
  Bot,
  MessageSquare,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
} from 'lucide-react';
import { ReceiptIcon } from '@/components/ReceiptIcon';

interface StagedReceipt {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

interface ReceiptData {
  id: string;
  no?: number;
  date: string;
  receiptNo: string | null;
  payee: string;
  vendorTin: string | null;
  description: string | null;
  department: string | null;
  project: string | null;
  expenseCode: string | null;
  paymentMethod: string | null;
  currency: string;
  rate: number;
  amountExclVat: number;
  vat: number;
  total: number;
  totalBaseEquiv: number;
  status: string;
  approvedById?: string | null;
  imageUrl: string;
  rawExtractedJson?: string | null;
  submittedBy?: string | null;
  claimant?: { name: string; email: string };
  approvedBy?: { name: string; email: string };
  createdAt?: string;
}

const TRANSLATIONS = {
  en: {
    greeting: 'Welcome back',
    spendingLabel: 'SPENDING',
    usdSub: 'Includes USD receipts, converted at active rate',
    typingSaved: 'hours of manual entry saved',
    scanReceipt: 'Scan receipt',
    scanDesc: 'Webcam or phone camera',
    uploadFiles: 'Upload files',
    uploadDesc: 'Photo, PDF or KHQR screenshot',
    recentReceipts: 'Recent receipts',
    seeAll: 'See all',
    receiptsCount: 'Receipts',
    toReview: 'To review',
    approved: 'Approved',
    openApprovals: 'Open approvals',
    autoRead: 'auto-read',
    spendingByCategory: 'Spending by category',
    rielTotal: 'riel total',
    transportTip: 'Live dual-currency tracking with active conversion rate.',
    home: 'Home',
    chatbot: 'Chatbot',
    approvals: 'Approvals',
    reports: 'Reports',
    archive: 'Archive',
    settings: 'Settings',
    exportExcel: 'Export to Excel (.xlsx)',
    reviewReceipt: 'Review receipt',
    fieldsNeedCheck: 'fields need your check',
    approveAddReport: 'Approve and add to report',
    retake: 'Retake',
  },
  km: {
    greeting: 'សួស្តី',
    spendingLabel: 'ការចំណាយ',
    usdSub: 'រួមបញ្ចូលវិក្កយបត្រដុល្លារ ប្តូរតាមអត្រាកំណត់',
    typingSaved: 'ម៉ោងចំណេញពីការបញ្ចូលទិន្នន័យ',
    scanReceipt: 'ស្កេនវិក្កយបត្រ',
    scanDesc: 'កាមេរ៉ាកុំព្យូទ័រ ឬទូរស័ព្ទ',
    uploadFiles: 'បញ្ចូលឯកសារ',
    uploadDesc: 'រូបថត, PDF ឬ រូបថតអេក្រង់ KHQR',
    recentReceipts: 'វិក្កយបត្រថ្មីៗ',
    seeAll: 'មើលទាំងអស់',
    receiptsCount: 'វិក្កយបត្រសរុប',
    toReview: 'ត្រូវត្រួតពិនិត្យ',
    approved: 'បានអនុម័ត',
    openApprovals: 'រង់ចាំអនុម័ត',
    autoRead: 'ស្កេនស្វ័យប្រវត្ត',
    spendingByCategory: 'ការចំណាយតាមប្រភេទ',
    rielTotal: 'រៀលសរុប',
    transportTip: 'តាមដានការចំណាយជាក់ស្តែង និងប្តូរប្រាក់តាមអត្រាកំណត់។',
    home: 'ទំព័រដើម',
    chatbot: 'ឆាតបូត AI',
    approvals: 'ការអនុម័ត',
    reports: 'របាយការណ៍',
    archive: 'បណ្ណសារ',
    settings: 'ការកំណត់',
    exportExcel: 'ទាញយក Excel (.xlsx)',
    reviewReceipt: 'ត្រួតពិនិត្យវិក្កយបត្រ',
    fieldsNeedCheck: 'ចន្លោះទាមទារការផ្ទៀងផ្ទាត់',
    approveAddReport: 'អនុម័ត និងបញ្ចូលក្នុងរបាយការណ៍',
    retake: 'ថតឡើងវិញ',
  },
};

const CATEGORY_COLORS = [
  '#7A222B', // Burgundy
  '#E8BA5A', // Gold
  '#0D9488', // Teal
  '#2563EB', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#64748B', // Slate
];

interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'MEMBER';
  department?: string;
  workspaceId?: string;
  workspaceName?: string;
  inviteCode?: string;
}

export default function KomnottraApp() {
  const [activeScreen, setActiveScreen] = useState<'home' | 'scan' | 'review' | 'batch-review' | 'approvals' | 'reports' | 'archive' | 'settings' | 'team' | 'analytics' | 'income' | 'chatbot'>('home');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const t = TRANSLATIONS.en;

  // User Authentication & Session State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  // Workspace Creation & Onboarding State
  const [creationStep, setCreationStep] = useState<number>(0); // 0 = initial cards, 1 = currency & rate, 2 = categories & depts
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
  const [newWorkspaceCurrency, setNewWorkspaceCurrency] = useState<'KHR' | 'USD'>('KHR');
  const [newWorkspaceRate, setNewWorkspaceRate] = useState<number>(4100);
  const [wizardCategories, setWizardCategories] = useState<string[]>([
    'Meals & Dining',
    'Transport & Fuel',
    'Office Supplies',
    'Utilities & Telecom',
    'Lodging & Travel',
    'Equipment & IT',
  ]);
  const [wizardCategoryInput, setWizardCategoryInput] = useState<string>('');
  const [wizardDepartments, setWizardDepartments] = useState<string[]>([
    'Administration',
    'Operations',
    'Sales & Marketing',
    'Finance & Accounting',
    'Engineering / IT',
  ]);
  const [wizardDeptInput, setWizardDeptInput] = useState<string>('');
  const [joinInviteCode, setJoinInviteCode] = useState<string>('');
  const [isCreatingWs, setIsCreatingWs] = useState<boolean>(false);

  // Team & Members Management State
  const [members, setMembers] = useState<any[]>([]);
  const [isRefreshingMembers, setIsRefreshingMembers] = useState<boolean>(false);

  // Live Database Receipts & Incomes
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<'ALL' | 'KHR' | 'USD'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('APPROVED');
  const [headerRateInput, setHeaderRateInput] = useState<string>('4100');

  // Unified Reports Filters
  const [reportTypeFilter, setReportTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('APPROVED');

  // Approvals & Duplicate Queue State
  const [approvalTab, setApprovalTab] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  const [selectedAuditItem, setSelectedAuditItem] = useState<any | null>(null);
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<string[]>([]);
  const [isBatchApproving, setIsBatchApproving] = useState<boolean>(false);

  // Review Form (Human-in-the-Loop)
  const [reviewForm, setReviewForm] = useState({
    vendor: '',
    receiptNo: '',
    date: new Date().toLocaleDateString('en-GB'),
    total: '',
    currency: 'KHR' as 'KHR' | 'USD',
    vat: '',
    vendorTin: '',
    category: 'General',
    department: 'General',
    note: '',
    imageUrl: '',
    confidence: 100,
  });

  // Real Webcam & Camera Capture State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Staged Queue for Native Camera & Batch Scanning
  const [stagedReceipts, setStagedReceipts] = useState<StagedReceipt[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    statusText: string;
  }>({ current: 0, total: 0, statusText: '' });

  // Laptop / PC Webcam Modal State
  const [isWebcamModalOpen, setIsWebcamModalOpen] = useState<boolean>(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [lastSnappedNotice, setLastSnappedNotice] = useState<string>('');
  const [webcamError, setWebcamError] = useState<string>('');
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);

  // Batch Review Screen & Edit Inspector Modal State
  const [parsedBatchReceipts, setParsedBatchReceipts] = useState<ReceiptData[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState<boolean>(false);
  const [editingReceipt, setEditingReceipt] = useState<ReceiptData | null>(null);
  const [editFormData, setEditFormData] = useState({
    payee: '',
    receiptNo: '',
    date: '',
    total: '',
    currency: 'KHR' as 'KHR' | 'USD',
    vat: '',
    vendorTin: '',
    expenseCode: 'General',
    department: 'General',
    description: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [isDeletingReceipt, setIsDeletingReceipt] = useState<boolean>(false);
  const [modalMobileTab, setModalMobileTab] = useState<'both' | 'photo' | 'form'>('both');
  const [fullscreenPhotoUrl, setFullscreenPhotoUrl] = useState<string | null>(null);
  const [isLightboxZoomed, setIsLightboxZoomed] = useState<boolean>(false);

  const handleToggleSelectAllBatch = () => {
    if (selectedBatchIds.length === parsedBatchReceipts.length && parsedBatchReceipts.length > 0) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(parsedBatchReceipts.map((r) => r.id));
    }
  };

  const handleToggleSelectOneBatch = (id: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteDraftReceipt = (id: string) => {
    setParsedBatchReceipts((prev) => prev.filter((r) => r.id !== id));
    setSelectedBatchIds((prev) => prev.filter((item) => item !== id));
  };

  const handleDeleteSelectedBatch = () => {
    if (selectedBatchIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedBatchIds.length} selected draft receipt${selectedBatchIds.length > 1 ? 's' : ''}?`)) {
      return;
    }
    setParsedBatchReceipts((prev) => prev.filter((r) => !selectedBatchIds.includes(r.id)));
    setSelectedBatchIds([]);
  };

  const handleSubmitBatchForApproval = async () => {
    if (selectedBatchIds.length === 0) return;
    setIsSubmittingBatch(true);
    try {
      const selectedDrafts = parsedBatchReceipts.filter((r) => selectedBatchIds.includes(r.id));
      
      const payload = selectedDrafts.map((draft) => ({
        payee: draft.payee || 'Scanned Vendor',
        receiptNo: draft.receiptNo || '—',
        date: draft.date || new Date().toLocaleDateString('en-GB'),
        total: draft.total || 0,
        currency: draft.currency || 'KHR',
        vat: draft.vat || 0,
        vendorTin: draft.vendorTin || '—',
        expenseCode: draft.expenseCode || (workspaceSettings.expenseCodes[0] || 'General'),
        department: draft.department || currentUser?.department || (workspaceSettings.departments[0] || 'General'),
        project: draft.project || 'General Expenses',
        note: draft.description || 'Batch claim',
        imageUrl: draft.imageUrl || '',
        status: 'PENDING',
        rawExtractedJson: draft.rawExtractedJson,
      }));

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipts: payload }),
      });
      const data = await res.json();
      const submittedCount = data.success ? (data.count || payload.length) : 0;

      setParsedBatchReceipts((prev) => prev.filter((r) => !selectedBatchIds.includes(r.id)));
      setSelectedBatchIds([]);
      await fetchLiveReceipts();
      setActiveScreen('approvals');
      setSettingsNotice(`Submitted ${submittedCount} receipt${submittedCount > 1 ? 's' : ''} to Approvals! Review and approve them to add to Reports.`);
    } catch (err: any) {
      alert('Error submitting receipts: ' + err.message);
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMobileDevice(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    }
  }, []);


  const getUserInitials = (user?: CurrentUser | null) => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Chatbot State & Handlers
  interface ChatMessageItem {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }

  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-bot',
      role: 'assistant',
      content: `Hello! I am your **Komnottra Chatbot**.\n\nI can analyze your approved receipts, track client incomes, calculate your monthly burn rate, forecast cash runway, and break down spending by category or department.\n\nAsk me anything or tap one of the suggested prompts above!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeScreen === 'chatbot') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeScreen]);

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = (presetText || chatInput).trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessageItem = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    if (!presetText) setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: updatedMessages.slice(1, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'ai-' + Date.now(),
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            role: 'assistant',
            content: data.error || 'Unable to connect to Chatbot at this time.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: `Network error: ${err.message || 'Could not communicate with server.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const fetchLiveReceipts = async () => {
    try {
      const res = await fetch('/api/receipts');
      const data = await res.json();
      if (data.success && data.receipts) {
        setReceipts(data.receipts);
      }
    } catch (err) {
      console.error('Failed to load receipts:', err);
    }
  };

  // Synchronize Unified Approval Queue (Pending Receipts + Pending Incomes)
  useEffect(() => {
    const pendingReceipts = receipts
      .filter((r: ReceiptData) => r.status === 'PENDING')
      .map((r: ReceiptData) => ({
        id: r.id,
        itemType: 'EXPENSE' as const,
        vendor: r.payee,
        claimant: r.submittedBy || r.claimant?.name || r.claimant?.email || 'Staff member',
        submittedBy: r.submittedBy || r.claimant?.name || r.claimant?.email || 'Staff member',
        date: r.date,
        category: r.expenseCode || 'General',
        total: r.total,
        currency: r.currency,
        vat: r.vat,
        flag: r.vendorTin === '—' ? 'Missing TIN' : 'Expense Claim',
        note: r.description || 'Submitted expense claim',
        imageUrl: r.imageUrl,
        rawReceipt: r,
        createdAt: r.createdAt,
      }));

    const pendingIncomes = incomes
      .filter((inc: any) => inc.status === 'PENDING')
      .map((inc: any) => ({
        id: inc.id,
        itemType: 'INCOME' as const,
        vendor: inc.clientName,
        claimant: inc.submittedBy || 'Finance / Web',
        submittedBy: inc.submittedBy || 'Finance / Web',
        date: inc.date || (inc.createdAt ? inc.createdAt.substring(0, 10) : ''),
        category: inc.category || 'Client Services',
        total: inc.total,
        currency: inc.currency,
        vat: 0,
        flag: 'Revenue Inflow',
        note: inc.invoiceNo ? `Invoice #${inc.invoiceNo} · ${inc.paymentMethod || 'Bank Transfer'}` : (inc.paymentMethod || 'Client Inflow'),
        imageUrl: '',
        rawIncome: inc,
        createdAt: inc.createdAt,
      }));

    const combined = [...pendingReceipts, ...pendingIncomes].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    setApprovalQueue(combined);
  }, [receipts, incomes]);

  // Workspace Settings & Policies State
  const [workspaceSettings, setWorkspaceSettings] = useState<{
    id?: string;
    name: string;
    baseCurrency: 'KHR' | 'USD';
    exchangeRate: number;
    rateMode: string;
    flagMissingTin: boolean;
    inviteCode?: string;
    columns: Array<{ id: string; key: string; label: string; isVisible: boolean; isRequired: boolean; order: number }>;
    expenseCodes: string[];
    departments: string[];
    telegramBotToken?: string;
    telegramChatId?: string;
    telegramMemberChatIds?: string;
    telegramBotActive?: boolean;
    telegramBotUsername?: string;
    notifyHighSpend?: boolean;
    notifyHighSpendMin?: number;
    notifyDailyDigest?: boolean;
    notifyNewIncome?: boolean;
    notifyAnomalies?: boolean;
    notifyBudgetAlert?: boolean;
    monthlyBudgetUsd?: number;
  }>({
    name: 'Workspace',
    baseCurrency: 'KHR',
    exchangeRate: 4000,
    rateMode: 'NBC_AUTO',
    flagMissingTin: true,
    inviteCode: '',
    columns: [],
    expenseCodes: ['Meals', 'Transport', 'Office supplies', 'Utilities', 'Other'],
    departments: ['Administration', 'Sales', 'Engineering', 'Operations'],
    telegramBotToken: '',
    telegramChatId: '',
    telegramMemberChatIds: '',
    telegramBotActive: false,
    telegramBotUsername: '',
    notifyHighSpend: true,
    notifyHighSpendMin: 100,
    notifyDailyDigest: true,
    notifyNewIncome: true,
    notifyAnomalies: true,
    notifyBudgetAlert: true,
    monthlyBudgetUsd: 5000,
  });
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsNotice, setSettingsNotice] = useState<string>('');
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [newDeptInput, setNewDeptInput] = useState<string>('');

  // Executive Analytics & Predictive Runway State
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);

  // Inflow & Company Billing State
  const [isLoadingIncomes, setIsLoadingIncomes] = useState<boolean>(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState<boolean>(false);
  const [incomeForm, setIncomeForm] = useState({
    clientName: '',
    invoiceNo: '',
    tin: '',
    category: 'Client Services',
    paymentMethod: 'KHQR / Bank Transfer',
    currency: 'USD' as 'USD' | 'KHR',
    total: '',
    date: new Date().toISOString().substring(0, 10),
    status: 'RECEIVED' as 'RECEIVED' | 'PENDING' | 'OVERDUE',
    reference: '',
  });
  const [isSavingIncome, setIsSavingIncome] = useState<boolean>(false);

  // Telegram Testing State
  const [isTestingTelegram, setIsTestingTelegram] = useState<boolean>(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const fetchIncomes = async () => {
    setIsLoadingIncomes(true);
    try {
      const res = await fetch('/api/income');
      const data = await res.json();
      if (data.success && data.incomes) {
        setIncomes(data.incomes);
      }
    } catch (err) {
      console.error('Failed to load incomes:', err);
    } finally {
      setIsLoadingIncomes(false);
    }
  };

  // Income Inspector & Edit Modal State
  const [editingIncome, setEditingIncome] = useState<any | null>(null);
  const [isSavingEditIncome, setIsSavingEditIncome] = useState<boolean>(false);
  const [editIncomeFormData, setEditIncomeFormData] = useState({
    clientName: '',
    invoiceNo: '',
    tin: '',
    category: 'Client Services',
    paymentMethod: 'KHQR / Bank Transfer',
    currency: 'USD' as 'USD' | 'KHR',
    total: '',
    date: new Date().toISOString().substring(0, 10),
    reference: '',
  });

  const handleOpenEditIncome = (income: any) => {
    setEditingIncome(income);
    setEditIncomeFormData({
      clientName: income.clientName || '',
      invoiceNo: income.invoiceNo || '',
      tin: income.tin || '',
      category: income.category || 'Client Services',
      paymentMethod: income.paymentMethod || 'KHQR / Bank Transfer',
      currency: (income.currency === 'USD' ? 'USD' : 'KHR'),
      total: String(income.total ?? 0),
      date: income.date || (income.createdAt ? income.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10)),
      reference: income.reference || '',
    });
  };

  const handleCloseEditIncomeModal = () => {
    setEditingIncome(null);
  };

  const handleSaveEditIncome = async (e?: React.FormEvent, approveImmediately: boolean = false) => {
    if (e) e.preventDefault();
    if (!editingIncome) return;
    setIsSavingEditIncome(true);
    try {
      const res = await fetch('/api/income', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingIncome.id,
          clientName: editIncomeFormData.clientName,
          invoiceNo: editIncomeFormData.invoiceNo,
          tin: editIncomeFormData.tin,
          category: editIncomeFormData.category,
          paymentMethod: editIncomeFormData.paymentMethod,
          currency: editIncomeFormData.currency,
          total: parseFloat(editIncomeFormData.total) || 0,
          date: editIncomeFormData.date,
          reference: editIncomeFormData.reference,
          status: approveImmediately ? 'APPROVED' : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchIncomes();
        await fetchAnalytics();
        setEditingIncome(null);
        setSelectedAuditItem(null);
        setSelectedApprovalIds((prev) => prev.filter((i) => i !== editingIncome.id));
        setSettingsNotice(approveImmediately ? 'Income details updated and approved into reports!' : 'Income details updated successfully!');
      } else {
        alert(data.error || 'Failed to update income');
      }
    } catch (err: any) {
      alert('Error updating income: ' + err.message);
    } finally {
      setIsSavingEditIncome(false);
    }
  };

  const handleCreateIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeForm.clientName.trim() || !incomeForm.total) {
      alert('Please enter client name and total amount.');
      return;
    }
    setIsSavingIncome(true);
    try {
      const res = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...incomeForm,
          total: parseFloat(incomeForm.total),
          status: 'PENDING',
          submittedBy: currentUser?.name || currentUser?.email || 'Finance Team',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsIncomeModalOpen(false);
        setIncomeForm({
          clientName: '',
          invoiceNo: '',
          tin: '',
          category: 'Client Services',
          paymentMethod: 'KHQR / Bank Transfer',
          currency: 'USD',
          total: '',
          date: new Date().toISOString().substring(0, 10),
          status: 'PENDING',
          reference: '',
        });
        await fetchIncomes();
        await fetchAnalytics();
        setSettingsNotice('Company Income recorded and submitted to Approvals queue for review!');
        setTimeout(() => setSettingsNotice(''), 4000);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Failed to save income: ' + err.message);
    } finally {
      setIsSavingIncome(false);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!window.confirm('Delete this income record?')) return;
    try {
      const res = await fetch(`/api/income?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setIncomes((prev) => prev.filter((i) => i.id !== id));
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Failed to delete income:', err);
    }
  };

  const handleTestTelegram = async () => {
    if (!workspaceSettings.telegramBotToken) {
      alert('Please enter your Telegram Bot Token first.');
      return;
    }
    setIsTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: workspaceSettings.telegramBotToken,
          botToken: workspaceSettings.telegramBotToken,
          chatId: workspaceSettings.telegramChatId,
          memberChatIds: workspaceSettings.telegramMemberChatIds,
        }),
      });
      const data = await res.json();
      setTelegramTestResult({
        success: data.success,
        message: data.success
          ? `Successfully connected! Bot username: @${data.botUsername || 'your_bot'}. Webhook registered & test ping sent.`
          : (data.error || 'Connection failed. Please check Bot Token and Chat ID.'),
      });
      if (data.success && data.botUsername) {
        setWorkspaceSettings((prev) => ({
          ...prev,
          telegramBotActive: true,
          telegramBotUsername: data.botUsername,
        }));
      }
    } catch (err: any) {
      setTelegramTestResult({
        success: false,
        message: 'Network error testing Telegram: ' + err.message,
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const fetchWorkspace = async () => {
    try {
      const res = await fetch('/api/workspace');
      const data = await res.json();
      if (data.success && data.workspace) {
        const loadedRate = data.workspace.exchangeRate || 4000;
        const rawCodes = Array.isArray(data.workspace.expenseCodes) ? data.workspace.expenseCodes : [];
        const rawDepts = Array.isArray(data.workspace.departments) ? data.workspace.departments : [];
        const loadedCodes = rawCodes.length > 0 ? rawCodes : ['Meals', 'Transport', 'Office supplies', 'Utilities', 'Other'];
        const loadedDepts = rawDepts.length > 0 ? rawDepts : ['Administration', 'Sales', 'Engineering', 'Operations'];

        setWorkspaceSettings({
          id: data.workspace.id,
          name: data.workspace.name,
          baseCurrency: data.workspace.baseCurrency || 'KHR',
          exchangeRate: loadedRate,
          rateMode: data.workspace.rateMode || 'NBC_AUTO',
          flagMissingTin: data.workspace.flagMissingTin ?? true,
          inviteCode: data.workspace.inviteCode || '',
          columns: data.workspace.columns || [],
          expenseCodes: loadedCodes,
          departments: loadedDepts,
          telegramBotToken: data.workspace.telegramBotToken || '',
          telegramChatId: data.workspace.telegramChatId || '',
          telegramMemberChatIds: data.workspace.telegramMemberChatIds || '',
          telegramBotActive: Boolean(data.workspace.telegramBotActive),
          telegramBotUsername: data.workspace.telegramBotUsername || '',
          notifyHighSpend: data.workspace.notifyHighSpend ?? true,
          notifyHighSpendMin: data.workspace.notifyHighSpendMin ?? 100,
          notifyDailyDigest: data.workspace.notifyDailyDigest ?? true,
          notifyNewIncome: data.workspace.notifyNewIncome ?? true,
          notifyAnomalies: data.workspace.notifyAnomalies ?? true,
          notifyBudgetAlert: data.workspace.notifyBudgetAlert ?? true,
          monthlyBudgetUsd: data.workspace.monthlyBudgetUsd ?? 5000,
        });
        setHeaderRateInput(String(loadedRate));
        if (data.workspace.inviteCode) {
          setCurrentUser((prev) => (prev ? { ...prev, inviteCode: data.workspace.inviteCode } : prev));
        }
      }
    } catch (err) {
      console.error('Failed to load workspace settings:', err);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (workspaceSettings.expenseCodes.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('This category already exists.');
      return;
    }
    setWorkspaceSettings((prev) => ({
      ...prev,
      expenseCodes: [...prev.expenseCodes, trimmed],
    }));
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (workspaceSettings.expenseCodes.length <= 1) {
      alert('You must have at least one expense category.');
      return;
    }
    setWorkspaceSettings((prev) => ({
      ...prev,
      expenseCodes: prev.expenseCodes.filter((c) => c !== catToRemove),
    }));
  };

  const handleAddDepartment = () => {
    const trimmed = newDeptInput.trim();
    if (!trimmed) return;
    if (workspaceSettings.departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      alert('This department already exists.');
      return;
    }
    setWorkspaceSettings((prev) => ({
      ...prev,
      departments: [...prev.departments, trimmed],
    }));
    setNewDeptInput('');
  };

  const handleRemoveDepartment = (deptToRemove: string) => {
    if (workspaceSettings.departments.length <= 1) {
      alert('You must have at least one department.');
      return;
    }
    setWorkspaceSettings((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d !== deptToRemove),
    }));
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsNotice('');
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsNotice('Settings updated and saved to SQLite!');
        setTimeout(() => setSettingsNotice(''), 4000);
      } else {
        alert('Failed to save settings: ' + data.error);
      }
    } catch (err: any) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleBaseCurrency = async (curr: 'KHR' | 'USD') => {
    const updated = { ...workspaceSettings, baseCurrency: curr };
    setWorkspaceSettings(updated);
    try {
      await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseCurrency: curr }),
      });
      setSettingsNotice(`Primary reporting currency set to ${curr === 'USD' ? 'US Dollar ($)' : 'Khmer Riel (៛)'}`);
      setTimeout(() => setSettingsNotice(''), 3500);
    } catch (err) {
      console.error('Failed to auto-save base currency:', err);
    }
  };

  const handleUpdateExchangeRate = async (newRate: number) => {
    if (!newRate || isNaN(newRate) || newRate <= 0) return;
    setWorkspaceSettings((prev) => ({ ...prev, exchangeRate: newRate }));
    try {
      await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchangeRate: newRate }),
      });
      setSettingsNotice(`Exchange rate set to 1$ = ${newRate.toLocaleString()} ៛`);
      setTimeout(() => setSettingsNotice(''), 3000);
    } catch (err) {
      console.error('Failed to auto-save exchange rate:', err);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.user.workspaceId) {
          fetchLiveReceipts();
          fetchWorkspace();
          fetchMembers();
          fetchAnalytics();
          fetchIncomes();
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Session check error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  const handleProceedToWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) {
      alert('Please enter your company or workspace name.');
      return;
    }
    setCreationStep(1);
  };

  const handleWizardAddCategory = () => {
    const trimmed = wizardCategoryInput.trim();
    if (trimmed && !wizardCategories.includes(trimmed)) {
      setWizardCategories([...wizardCategories, trimmed]);
      setWizardCategoryInput('');
    }
  };

  const handleWizardRemoveCategory = (catToRemove: string) => {
    setWizardCategories(wizardCategories.filter((c) => c !== catToRemove));
  };

  const handleWizardAddDepartment = () => {
    const trimmed = wizardDeptInput.trim();
    if (trimmed && !wizardDepartments.includes(trimmed)) {
      setWizardDepartments([...wizardDepartments, trimmed]);
      setWizardDeptInput('');
    }
  };

  const handleWizardRemoveDepartment = (deptToRemove: string) => {
    setWizardDepartments(wizardDepartments.filter((d) => d !== deptToRemove));
  };

  const handleCreateWorkspace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setIsCreatingWs(true);
    try {
      const res = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkspaceName.trim(),
          baseCurrency: newWorkspaceCurrency,
          exchangeRate: newWorkspaceRate,
          departments: wizardDepartments,
          categories: wizardCategories,
        }),
      });
      const data = await res.json();
      if (data.success && data.workspace) {
        await fetchSession();
      } else {
        alert(data.error || 'Failed to create workspace');
      }
    } catch (err: any) {
      alert('Error creating workspace: ' + err.message);
    } finally {
      setIsCreatingWs(false);
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInviteCode.trim()) return;
    setIsCreatingWs(true);
    try {
      const res = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinInviteCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSession();
      } else {
        alert(data.error || 'Invalid invite code');
      }
    } catch (err: any) {
      alert('Error joining workspace: ' + err.message);
    } finally {
      setIsCreatingWs(false);
    }
  };

  const fetchMembers = async () => {
    setIsRefreshingMembers(true);
    try {
      const res = await fetch('/api/workspace/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
        if (data.inviteCode) {
          setWorkspaceSettings((prev) => ({ ...prev, inviteCode: data.inviteCode }));
          setCurrentUser((prev) => (prev ? { ...prev, inviteCode: data.inviteCode } : prev));
        }
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setIsRefreshingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this user from the workspace?')) return;
    try {
      const res = await fetch('/api/workspace/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMembers();
      } else {
        alert(data.error || 'Failed to remove member');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setShowUserMenu(false);
  };

  useEffect(() => {
    fetchSession();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'google_credentials_missing') {
        setAuthError('Google Cloud OAuth is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.');
      }
      if (params.get('invite')) {
        setJoinInviteCode(params.get('invite') || '');
      }
    }
  }, []);

  useEffect(() => {
    if (activeScreen === 'analytics') {
      fetchAnalytics();
    } else if (activeScreen === 'approvals') {
      fetchLiveReceipts();
      fetchIncomes();
    }
  }, [activeScreen]);

  // Start Real Webcam Stream
  const startWebcam = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraActive(true);
        }
      }
    } catch (err) {
      console.warn('Webcam permission not granted or available:', err);
    }
  };

  // Stop Webcam Stream
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const compressReceiptFile = (file: File): Promise<{ file: File; previewUrl: string; size: number }> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve({ file, previewUrl: '', size: file.size });
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIMENSION = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ file, previewUrl: '', size: file.size });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, previewUrl: dataUrl, size: file.size });
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve({
              file: compressedFile,
              previewUrl: dataUrl,
              size: blob.size,
            });
          },
          'image/jpeg',
          0.82
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ file, previewUrl: '', size: file.size });
      };

      img.src = objectUrl;
    });
  };

  const handleAddFilesToStage = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const results = await Promise.all(
      list.map(async (file) => {
        const isImg = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        if (!isImg && !isPdf) return null;

        const { file: optimizedFile, previewUrl, size } = await compressReceiptFile(file);
        return {
          id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file: optimizedFile,
          previewUrl,
          name: file.name,
          size,
        };
      })
    );

    const valid = results.filter((item): item is StagedReceipt => item !== null);
    if (valid.length > 0) {
      setStagedReceipts((prev) => [...prev, ...valid]);
    }
  };

  const handleRemoveStaged = (id: string) => {
    setStagedReceipts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearStaged = () => {
    setStagedReceipts([]);
  };

  const startWebcamStream = async () => {
    setWebcamError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setWebcamError('Webcam not supported or blocked in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
      });
      setWebcamStream(stream);
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        webcamVideoRef.current.play();
      }
    } catch (err: any) {
      console.error('Webcam start error:', err);
      setWebcamError(err.message || 'Camera access denied or webcam in use by another app.');
    }
  };

  const stopWebcamStream = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = null;
    }
  };

  const handleOpenWebcamModal = () => {
    setIsWebcamModalOpen(true);
    startWebcamStream();
  };

  const handleCloseWebcamModal = () => {
    stopWebcamStream();
    setIsWebcamModalOpen(false);
  };

  const handleSnapWebcamFrame = () => {
    if (!webcamVideoRef.current) return;
    const video = webcamVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `receipt-snap-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setStagedReceipts((prev) => [
        ...prev,
        {
          id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl: dataUrl,
          name: `Receipt #${prev.length + 1} (Camera)`,
          size: blob.size,
        },
      ]);
      setLastSnappedNotice(`Receipt added to tray!`);
      setTimeout(() => setLastSnappedNotice(''), 2000);
    }, 'image/jpeg', 0.82);
  };

  const handleTriggerCamera = () => {
    if (isMobileDevice) {
      mobileCameraInputRef.current?.click();
    } else {
      handleOpenWebcamModal();
    }
  };

  const handleProcessBatch = async () => {
    if (stagedReceipts.length === 0) return;
    setIsBatchProcessing(true);
    const total = stagedReceipts.length;
    let completedCount = 0;

    setBatchProgress({
      current: 0,
      total,
      statusText: `Starting extraction for ${total} receipt${total > 1 ? 's' : ''}...`,
    });

    const processSingleItem = async (item: StagedReceipt, index: number): Promise<ReceiptData | null> => {
      try {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('categories', JSON.stringify(workspaceSettings.expenseCodes));
        formData.append('departments', JSON.stringify(workspaceSettings.departments));

        const scanRes = await fetch('/api/scan', {
          method: 'POST',
          body: formData,
        });
        const scanData = await scanRes.json();

        if (scanData.success && scanData.extracted) {
          const ext = scanData.extracted;
          const parsedTotal = parseFloat(ext.total) || 0;
          const parsedVat = parseFloat(ext.vat) || 0;
          const exchangeRate = workspaceSettings.exchangeRate || 4000;

          // Return in-memory draft receipt without saving to DB yet
          const draftReceipt: ReceiptData = {
            id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            date: ext.date || new Date().toLocaleDateString('en-GB'),
            receiptNo: ext.receiptNo || '—',
            payee: ext.vendor || 'Scanned Vendor',
            vendorTin: ext.vendorTin || '—',
            description: ext.note || `Batch scan (${index + 1}/${total})`,
            department: ext.department || currentUser?.department || (workspaceSettings.departments[0] || 'General'),
            project: 'General Expenses',
            expenseCode: ext.category || (workspaceSettings.expenseCodes[0] || 'General'),
            paymentMethod: 'Cash',
            currency: (ext.currency as 'KHR' | 'USD') || 'KHR',
            rate: exchangeRate,
            amountExclVat: Math.max(0, parsedTotal - parsedVat),
            vat: parsedVat,
            total: parsedTotal,
            totalBaseEquiv: ext.currency === 'USD' ? parsedTotal * exchangeRate : parsedTotal,
            status: 'PENDING',
            imageUrl: ext.imageUrl || item.previewUrl || '',
            rawExtractedJson: JSON.stringify(ext),
            claimant: currentUser ? { name: currentUser.name, email: currentUser.email } : undefined,
          };
          return draftReceipt;
        }
      } catch (err) {
        console.error(`Parallel batch extraction error on receipt ${index + 1}:`, err);
      } finally {
        completedCount++;
        setBatchProgress({
          current: completedCount,
          total,
          statusText: `Starting extraction for ${total} receipt${total > 1 ? 's' : ''}...`,
        });
      }
      return null;
    };

    // Execute in parallel (batches of up to 5 concurrent streams)
    const CONCURRENCY_LIMIT = 5;
    const allResults: (ReceiptData | null)[] = [];
    for (let i = 0; i < stagedReceipts.length; i += CONCURRENCY_LIMIT) {
      const chunk = stagedReceipts.slice(i, i + CONCURRENCY_LIMIT);
      const chunkResults = await Promise.all(
        chunk.map((item, idx) => processSingleItem(item, i + idx))
      );
      allResults.push(...chunkResults);
    }

    const draftReceipts = allResults.filter((r): r is ReceiptData => r !== null);

    handleClearStaged();
    setIsBatchProcessing(false);

    if (draftReceipts.length > 0) {
      setParsedBatchReceipts(draftReceipts);
      setSelectedBatchIds(draftReceipts.map((d) => d.id)); // select all drafts by default
      setActiveScreen('batch-review');
      setSettingsNotice(`Successfully extracted ${draftReceipts.length} receipt${draftReceipts.length > 1 ? 's' : ''}! Review draft receipts, select items, and submit for review.`);
    } else {
      setSettingsNotice('No receipts were successfully extracted.');
      setActiveScreen('home');
    }
  };

  const handleOpenEditReceipt = (receipt: ReceiptData) => {
    setEditingReceipt(receipt);
    setModalMobileTab('both');
    setEditFormData({
      payee: receipt.payee || '',
      receiptNo: receipt.receiptNo || '',
      date: receipt.date || new Date().toLocaleDateString('en-GB'),
      total: String(receipt.total ?? 0),
      currency: (receipt.currency === 'USD' ? 'USD' : 'KHR'),
      vat: String(receipt.vat ?? 0),
      vendorTin: receipt.vendorTin || '',
      expenseCode: receipt.expenseCode || 'General',
      department: receipt.department || currentUser?.department || 'General',
      description: receipt.description || '',
    });
  };

  const handleCloseEditModal = () => {
    setEditingReceipt(null);
  };

  const handleSaveEditReceipt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingReceipt) return;

    // Handle local draft receipt edit
    if (editingReceipt.id.startsWith('draft-')) {
      const updatedTotal = parseFloat(String(editFormData.total)) || 0;
      const updatedVat = parseFloat(String(editFormData.vat)) || 0;
      const exchangeRate = workspaceSettings.exchangeRate || 4000;
      const updatedReceipt: ReceiptData = {
        ...editingReceipt,
        payee: editFormData.payee,
        receiptNo: editFormData.receiptNo,
        date: editFormData.date,
        total: updatedTotal,
        currency: editFormData.currency,
        vat: updatedVat,
        amountExclVat: Math.max(0, updatedTotal - updatedVat),
        totalBaseEquiv: editFormData.currency === 'USD' ? updatedTotal * exchangeRate : updatedTotal,
        vendorTin: editFormData.vendorTin,
        expenseCode: editFormData.expenseCode,
        department: editFormData.department,
        description: editFormData.description,
      };
      setParsedBatchReceipts((prev) =>
        prev.map((r) => (r.id === editingReceipt.id ? updatedReceipt : r))
      );
      setEditingReceipt(null);
      setSettingsNotice('Draft receipt details updated!');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch('/api/receipts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingReceipt.id,
          payee: editFormData.payee,
          receiptNo: editFormData.receiptNo,
          date: editFormData.date,
          total: parseFloat(String(editFormData.total)) || 0,
          currency: editFormData.currency,
          vat: parseFloat(String(editFormData.vat)) || 0,
          vendorTin: editFormData.vendorTin,
          expenseCode: editFormData.expenseCode,
          department: editFormData.department,
          description: editFormData.description,
        }),
      });
      const data = await res.json();
      if (data.success && data.receipt) {
        setParsedBatchReceipts((prev) =>
          prev.map((r) => (r.id === data.receipt.id ? { ...r, ...data.receipt } : r))
        );
        await fetchLiveReceipts();
        setEditingReceipt(null);
        setSettingsNotice('Receipt details successfully updated!');
      } else {
        alert(data.error || 'Failed to update receipt');
      }
    } catch (err) {
      console.error('Error updating receipt:', err);
      alert('Failed to save receipt updates');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
      return;
    }

    // Handle local draft receipt deletion
    if (id.startsWith('draft-')) {
      handleDeleteDraftReceipt(id);
      setEditingReceipt(null);
      setSettingsNotice('Draft receipt removed.');
      return;
    }

    setIsDeletingReceipt(true);
    try {
      const res = await fetch(`/api/receipts?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setParsedBatchReceipts((prev) => prev.filter((r) => r.id !== id));
        await fetchLiveReceipts();
        setEditingReceipt(null);
        setSettingsNotice('Receipt deleted successfully.');
      } else {
        alert(data.error || 'Failed to delete receipt');
      }
    } catch (err) {
      console.error('Error deleting receipt:', err);
      alert('Failed to delete receipt');
    } finally {
      setIsDeletingReceipt(false);
    }
  };


  const handleReviewSingleStaged = async (item: StagedReceipt) => {
    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('categories', JSON.stringify(workspaceSettings.expenseCodes));
      formData.append('departments', JSON.stringify(workspaceSettings.departments));

      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.extracted) {
        setReviewForm({
          vendor: data.extracted.vendor || '',
          receiptNo: data.extracted.receiptNo || '',
          date: data.extracted.date || new Date().toLocaleDateString('en-GB'),
          total: data.extracted.total ? data.extracted.total.toString() : '',
          currency: (data.extracted.currency as 'KHR' | 'USD') || 'KHR',
          vat: data.extracted.vat ? data.extracted.vat.toString() : '0',
          vendorTin: data.extracted.vendorTin || '—',
          category: data.extracted.category || (workspaceSettings.expenseCodes[0] || 'General'),
          department: data.extracted.department || currentUser?.department || (workspaceSettings.departments[0] || 'General'),
          note: data.extracted.note || '',
          imageUrl: data.extracted.imageUrl || item.previewUrl || '',
          confidence: data.extracted.confidence || 92,
        });
        handleRemoveStaged(item.id);
        setActiveScreen('review');
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
  };

  // Submitting Receipt to SQLite DB
  const handleApproveAndSave = async () => {
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payee: reviewForm.vendor || 'Unknown Vendor',
          receiptNo: reviewForm.receiptNo || '—',
          date: reviewForm.date || new Date().toLocaleDateString('en-GB'),
          total: parseFloat(reviewForm.total) || 0,
          currency: reviewForm.currency,
          vat: parseFloat(reviewForm.vat) || 0,
          vendorTin: reviewForm.vendorTin || '—',
          expenseCode: reviewForm.category || (workspaceSettings.expenseCodes[0] || 'General'),
          department: reviewForm.department || currentUser?.department || (workspaceSettings.departments[0] || 'General'),
          project: 'General Expenses',
          note: reviewForm.note,
          imageUrl: reviewForm.imageUrl || '',
          status: 'PENDING',
        }),
      });
      const result = await res.json();
      if (result.success) {
        await fetchLiveReceipts();
        setActiveScreen('approvals');
        setSettingsNotice('Receipt submitted for review! It has been placed in Approvals.');
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  // Live Excel Download
  const handleExportExcel = () => {
    window.location.href = `/api/export?status=${reportStatusFilter}`;
  };

  // Approvals Queue Decisions (Supports both Receipts and Incomes)
  const handleQueueDecision = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'approve' && currentUser?.role !== 'OWNER') {
      alert('Only the Workspace Owner has the authority to approve claims into reports.');
      return;
    }

    const item = approvalQueue.find((q) => q.id === id);
    const isIncome = item?.itemType === 'INCOME';

    try {
      const endpoint = isIncome ? '/api/income' : '/api/receipts';
      const targetStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: targetStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (isIncome) {
          await fetchIncomes();
        } else {
          await fetchLiveReceipts();
        }
        await fetchAnalytics();
        setSelectedAuditItem(null);
        setSelectedApprovalIds((prev) => prev.filter((i) => i !== id));
        setSettingsNotice(
          action === 'approve'
            ? `${isIncome ? 'Income' : 'Receipt'} approved and added to reports!`
            : `${isIncome ? 'Income' : 'Receipt'} rejected.`
        );
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Approval decision error:', err);
    }
  };

  const handleToggleSelectApproval = (id: string) => {
    setSelectedApprovalIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllApprovals = () => {
    if (selectedApprovalIds.length === approvalQueue.length && approvalQueue.length > 0) {
      setSelectedApprovalIds([]);
    } else {
      setSelectedApprovalIds(approvalQueue.map((item) => item.id));
    }
  };

  const handleApproveAllQueue = async () => {
    if (approvalQueue.length === 0) return;
    if (currentUser?.role !== 'OWNER') {
      alert('Only the Workspace Owner has the authority to approve items.');
      return;
    }
    const count = approvalQueue.length;
    if (!window.confirm(`As Workspace Owner, do you want to approve all ${count} pending item${count > 1 ? 's' : ''}? They will immediately be added to official reports and financial statements.`)) {
      return;
    }
    setIsBatchApproving(true);
    try {
      const receiptIds = approvalQueue.filter((item) => item.itemType === 'EXPENSE').map((item) => item.id);
      const incomeIds = approvalQueue.filter((item) => item.itemType === 'INCOME').map((item) => item.id);

      if (receiptIds.length > 0) {
        await fetch('/api/receipts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: receiptIds, status: 'APPROVED' }),
        });
      }

      if (incomeIds.length > 0) {
        await fetch('/api/income', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: incomeIds, status: 'APPROVED' }),
        });
      }

      await Promise.all([fetchLiveReceipts(), fetchIncomes(), fetchAnalytics()]);
      setSelectedAuditItem(null);
      setSelectedApprovalIds([]);
      setSettingsNotice(`Successfully approved all ${count} item${count > 1 ? 's' : ''}! They are now recorded in Reports.`);
    } catch (err: any) {
      console.error('Batch approval error:', err);
      alert('Error approving all items: ' + err.message);
    } finally {
      setIsBatchApproving(false);
    }
  };

  const handleApproveSelectedQueue = async () => {
    if (selectedApprovalIds.length === 0) return;
    if (currentUser?.role !== 'OWNER') {
      alert('Only the Workspace Owner has the authority to approve claims and incomes.');
      return;
    }
    const count = selectedApprovalIds.length;
    if (!window.confirm(`Approve ${count} selected item${count > 1 ? 's' : ''}?`)) {
      return;
    }
    setIsBatchApproving(true);
    try {
      const selectedItems = approvalQueue.filter((item) => selectedApprovalIds.includes(item.id));
      const receiptIds = selectedItems.filter((item) => item.itemType === 'EXPENSE').map((item) => item.id);
      const incomeIds = selectedItems.filter((item) => item.itemType === 'INCOME').map((item) => item.id);

      if (receiptIds.length > 0) {
        await fetch('/api/receipts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: receiptIds, status: 'APPROVED' }),
        });
      }

      if (incomeIds.length > 0) {
        await fetch('/api/income', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: incomeIds, status: 'APPROVED' }),
        });
      }

      await Promise.all([fetchLiveReceipts(), fetchIncomes(), fetchAnalytics()]);
      setSelectedAuditItem(null);
      setSelectedApprovalIds([]);
      setSettingsNotice(`Successfully approved ${count} selected item${count > 1 ? 's' : ''}!`);
    } catch (err: any) {
      console.error('Batch approval error:', err);
      alert('Error approving selected items: ' + err.message);
    } finally {
      setIsBatchApproving(false);
    }
  };

  const handleRejectSelectedQueue = async () => {
    if (selectedApprovalIds.length === 0) return;
    const count = selectedApprovalIds.length;
    if (!window.confirm(`Reject ${count} selected item${count > 1 ? 's' : ''}?`)) {
      return;
    }
    setIsBatchApproving(true);
    try {
      const selectedItems = approvalQueue.filter((item) => selectedApprovalIds.includes(item.id));
      const receiptIds = selectedItems.filter((item) => item.itemType === 'EXPENSE').map((item) => item.id);
      const incomeIds = selectedItems.filter((item) => item.itemType === 'INCOME').map((item) => item.id);

      if (receiptIds.length > 0) {
        await fetch('/api/receipts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: receiptIds, status: 'REJECTED' }),
        });
      }

      if (incomeIds.length > 0) {
        await fetch('/api/income', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: incomeIds, status: 'REJECTED' }),
        });
      }

      await Promise.all([fetchLiveReceipts(), fetchIncomes(), fetchAnalytics()]);
      setSelectedAuditItem(null);
      setSelectedApprovalIds([]);
      setSettingsNotice(`Rejected ${count} item${count > 1 ? 's' : ''}.`);
    } catch (err: any) {
      console.error('Batch rejection error:', err);
      alert('Error rejecting items: ' + err.message);
    } finally {
      setIsBatchApproving(false);
    }
  };

  // Financial Calculations & Approved Ledger Construction
  const isBaseUsd = workspaceSettings.baseCurrency === 'USD';
  const exchangeRate = (workspaceSettings.exchangeRate && workspaceSettings.exchangeRate >= 1) ? workspaceSettings.exchangeRate : 4000;

  const approvedReceipts = receipts.filter((r) => r.status === 'APPROVED' || r.status === 'REIMBURSED');
  const pendingReceipts = receipts.filter((r) => r.status === 'PENDING');
  const approvedIncomes = incomes.filter((inc) => inc.status === 'APPROVED');
  const pendingIncomes = incomes.filter((inc) => inc.status === 'PENDING');

  // Expense Totals (Approved Only)
  const totalSpendKhr = approvedReceipts.reduce((acc, r) => {
    if (r.currency === 'USD') return acc + Math.round(r.total * exchangeRate);
    return acc + r.total;
  }, 0);
  const totalSpendUsd = approvedReceipts.reduce((acc, r) => {
    if (r.currency === 'USD') return acc + r.total;
    return acc + (r.total / exchangeRate);
  }, 0);
  const totalUsdPortion = approvedReceipts.filter((r) => r.currency === 'USD').reduce((acc, r) => acc + r.total, 0);
  const totalKhrPortion = approvedReceipts.filter((r) => r.currency === 'KHR').reduce((acc, r) => acc + r.total, 0);
  const approvedCount = approvedReceipts.length;

  // Income Totals (Approved Only)
  const totalIncomeKhr = approvedIncomes.reduce((acc, inc) => {
    if (inc.currency === 'USD') return acc + Math.round(inc.total * exchangeRate);
    return acc + inc.total;
  }, 0);
  const totalIncomeUsd = approvedIncomes.reduce((acc, inc) => {
    if (inc.currency === 'USD') return acc + inc.total;
    return acc + (inc.total / exchangeRate);
  }, 0);

  // Net Cashflow (Approved Inflow - Approved Outflow)
  const netCashflowUsd = totalIncomeUsd - totalSpendUsd;
  const netCashflowKhr = totalIncomeKhr - totalSpendKhr;

  // Unified Transactions List for Combined Reports & Recent Activity
  type UnifiedTx = {
    id: string;
    itemType: 'INCOME' | 'EXPENSE';
    date: string;
    refNo: string;
    party: string;
    category: string;
    department?: string;
    description: string;
    submitter: string;
    currency: 'USD' | 'KHR';
    total: number;
    baseEquiv: number;
    status: string;
    rawItem: any;
  };

  const allExpenseTxs: UnifiedTx[] = receipts.map((r) => {
    const equiv = isBaseUsd
      ? (r.currency === 'USD' ? r.total : r.total / exchangeRate)
      : (r.currency === 'KHR' ? r.total : r.total * exchangeRate);
    return {
      id: r.id,
      itemType: 'EXPENSE',
      date: r.date || '',
      refNo: r.receiptNo || '—',
      party: r.payee,
      category: r.expenseCode || 'General',
      department: r.department || 'General',
      description: r.description || 'Expense claim',
      submitter: r.submittedBy || r.claimant?.name || 'Staff member',
      currency: (r.currency === 'USD' ? 'USD' : 'KHR'),
      total: r.total,
      baseEquiv: -equiv,
      status: r.status,
      rawItem: r,
    };
  });

  const allIncomeTxs: UnifiedTx[] = incomes.map((inc) => {
    const equiv = isBaseUsd
      ? (inc.currency === 'USD' ? inc.total : inc.total / exchangeRate)
      : (inc.currency === 'KHR' ? inc.total : inc.total * exchangeRate);
    return {
      id: inc.id,
      itemType: 'INCOME',
      date: inc.date || (inc.createdAt ? inc.createdAt.substring(0, 10) : ''),
      refNo: inc.invoiceNo || '—',
      party: inc.clientName,
      category: inc.category || 'Revenue',
      department: 'Finance',
      description: inc.reference || inc.paymentMethod || 'Client payment',
      submitter: inc.submittedBy || 'Finance',
      currency: (inc.currency === 'USD' ? 'USD' : 'KHR'),
      total: inc.total,
      baseEquiv: equiv,
      status: inc.status,
      rawItem: inc,
    };
  });

  const allUnifiedTransactions = [...allExpenseTxs, ...allIncomeTxs].sort((a, b) => {
    return b.date.localeCompare(a.date);
  });

  // Approved-only transactions for Home screen
  const approvedUnifiedTransactions = allUnifiedTransactions.filter(
    (tx) => tx.status === 'APPROVED' || tx.status === 'REIMBURSED'
  );

  // Filtered transactions for Combined Reports Screen
  const filteredCombinedTransactions = allUnifiedTransactions.filter((tx) => {
    const matchesSearch =
      tx.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = reportTypeFilter === 'ALL' || tx.itemType === reportTypeFilter;
    const matchesStatus = reportStatusFilter === 'ALL' || tx.status === reportStatusFilter;
    const matchesCurr = selectedCurrency === 'ALL' || tx.currency === selectedCurrency;
    const matchesDept = selectedDept === 'ALL' || (tx.department && tx.department === selectedDept);
    return matchesSearch && matchesType && matchesStatus && matchesCurr && matchesDept;
  });

  // Filter calculations for legacy export/receipts
  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.receiptNo && r.receiptNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDept === 'ALL' || r.department === selectedDept;
    const matchesStatus = reportStatusFilter === 'ALL' || r.status === reportStatusFilter;
    const matchesCurr = selectedCurrency === 'ALL' || r.currency === selectedCurrency;
    return matchesSearch && matchesDept && matchesStatus && matchesCurr;
  });

  // Dynamic Category Breakdown based on real workspace receipts and owner configured categories
  const currentCategories = workspaceSettings.expenseCodes && workspaceSettings.expenseCodes.length > 0
    ? workspaceSettings.expenseCodes
    : ['Meals', 'Transport', 'Office supplies', 'Utilities', 'Other'];

  const categoryTotals: Record<string, number> = {};
  currentCategories.forEach((cat) => {
    categoryTotals[cat] = 0;
  });

  approvedReceipts.forEach((r) => {
    const code = (r.expenseCode || '').trim();
    const equiv = r.currency === 'USD' ? Math.round(r.total * exchangeRate) : r.total;
    const match = currentCategories.find(
      (c) => c.toLowerCase() === code.toLowerCase() || (code && code.toLowerCase().includes(c.toLowerCase()))
    );
    if (match) {
      categoryTotals[match] = (categoryTotals[match] || 0) + equiv;
    } else {
      const fallback = currentCategories.find((c) => c.toLowerCase() === 'other') || currentCategories[0];
      categoryTotals[fallback] = (categoryTotals[fallback] || 0) + equiv;
    }
  });

  const getCategoryPct = (cat: string) => {
    if (totalSpendKhr === 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((categoryTotals[cat] || 0) / totalSpendKhr) * 100)));
  };

  const currentMonthYear = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  const currentFullDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  let accumulatedPct = 0;
  const gradientStops: string[] = [];
  currentCategories.forEach((cat, idx) => {
    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
    const pct = getCategoryPct(cat);
    const start = accumulatedPct;
    const end = Math.min(100, accumulatedPct + pct);
    accumulatedPct = end;
    gradientStops.push(`${color} ${start}% ${end}%`);
  });
  if (accumulatedPct < 100) {
    gradientStops.push(`#E2E8F0 ${accumulatedPct}% 100%`);
  }

  const dynamicDonutBg = totalSpendKhr === 0
    ? '#EFE8DE'
    : `conic-gradient(${gradientStops.join(', ')})`;

  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = topCategoryEntry?.[0] || 'General';
  const topCategoryPct = getCategoryPct(topCategoryName);

  const getCategoryDotColor = (code?: string | null) => {
    if (!code) return '#94A3B8';
    const matchIdx = currentCategories.findIndex(
      (c) => c.toLowerCase() === code.toLowerCase() || code.toLowerCase().includes(c.toLowerCase())
    );
    if (matchIdx !== -1) {
      return CATEGORY_COLORS[matchIdx % CATEGORY_COLORS.length];
    }
    return '#94A3B8';
  };

  const formatReceiptAmount = (total: number, currency: string) => {
    const num = Number(total) || 0;
    if (currency === 'USD') {
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (num % 1 !== 0) {
      return `${num.toLocaleString('en-US', { maximumFractionDigits: 2 })} ៛`;
    }
    return `${num.toLocaleString('en-US')} ៛`;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'APPROVED') return styles.statusApproved;
    if (status === 'REJECTED') return styles.statusRejected;
    if (status === 'REIMBURSED') return styles.statusProcessing;
    return styles.statusNeedsCheck;
  };

  // Dynamic receipt review validation
  const isAmountMissing = !reviewForm.total || parseFloat(reviewForm.total) <= 0;
  const isVendorMissing = !reviewForm.vendor || reviewForm.vendor.trim() === '';
  const isDateMissing = !reviewForm.date || reviewForm.date.trim() === '';
  const fieldsNeedingCheck = [
    isAmountMissing ? 'amount' : null,
    isVendorMissing ? 'vendor' : null,
    isDateMissing ? 'date' : null,
  ].filter(Boolean);
  const fieldsNeedingCheckCount = fieldsNeedingCheck.length;
  const clearFieldsCount = Math.max(1, 8 - fieldsNeedingCheckCount);

  if (isAuthLoading) {
    return (
      <div className={styles.authContainer}>
        <div style={{ textAlign: 'center', color: '#7A222B', fontWeight: 700 }}>
          <div className={styles.logoBox} style={{ margin: '0 auto 16px auto', width: '48px', height: '48px' }}>
            <ReceiptIcon size={26} strokeWidth={2.2} />
          </div>
          <div style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1F1916' }}>Komnottra</div>
          <div style={{ fontSize: '12px', color: '#8C8075', marginTop: '4px' }}>Checking secure session...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.logoBox} style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '4px' }}>
              <ReceiptIcon size={26} strokeWidth={2.2} />
            </div>
            <div className={styles.authBrandText}>
              <span className={styles.authBrandName}>Komnottra</span>
              <span className={styles.authBrandKhmer}>កំណត់ត្រា</span>
            </div>
          </div>

          {authError && (
            <div className={styles.authErrorBanner}>
              <AlertTriangle size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              {authError}
            </div>
          )}

          {/* Real Google Sign In Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className={styles.authGoogleBtn}
              onClick={handleGoogleSignIn}
              disabled={authSubmitting}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <div className={styles.authGoogleInfo}>
              Sign in with your Google account to access your company workspace or accept team invitations.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Workspace Onboarding Gate: User is authenticated with Google, but not yet attached to a workspace
  if (currentUser && !currentUser.workspaceId) {
    return (
      <div className={styles.onboardingContainer}>
        <div className={styles.onboardingShell}>
          <div className={styles.onboardingHeader}>
            <div className={styles.logoBox} style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
              <ReceiptIcon size={26} strokeWidth={2.2} />
            </div>
            <div className={styles.onboardingWelcome}>
              <span>Welcome, {currentUser.name}!</span>
            </div>
            <h1 className={styles.onboardingTitle}>Setup Your Workspace</h1>
          </div>

          {creationStep === 0 && (
            <div className={styles.onboardingGrid}>
              {/* Option 1: Create New Workspace */}
              <div className={styles.onboardingCard}>
                <div className={styles.onboardingCardTop}>
                  <div className={styles.onboardingCardIcon}>
                    <Building2 size={26} color="#7A222B" strokeWidth={2.2} />
                  </div>
                  <div className={styles.onboardingCardTitle}>Create New Workspace</div>
                </div>

                <form onSubmit={handleProceedToWizard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className={styles.settingsLabel}>Company / Workspace Name</label>
                    <input
                      type="text"
                      required
                      className={styles.onboardingInput}
                      placeholder="e.g. Phnom Penh Trading Co., Ltd."
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.onboardingBtnPrimary}
                  >
                    <span>Continue to Setup</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              {/* Option 2: Join with Invite Code */}
              <div className={styles.onboardingCard}>
                <div className={styles.onboardingCardTop}>
                  <div className={styles.onboardingCardIcon}>
                    <LinkIcon size={26} color="#7A222B" strokeWidth={2.2} />
                  </div>
                  <div className={styles.onboardingCardTitle}>Join Existing Workspace</div>
                </div>

                <form onSubmit={handleJoinWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className={styles.settingsLabel}>Workspace Invite Code</label>
                    <input
                      type="text"
                      required
                      className={styles.onboardingInput}
                      placeholder="e.g. KOM-1234"
                      value={joinInviteCode}
                      onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.onboardingBtnSecondary}
                    disabled={isCreatingWs}
                  >
                    {isCreatingWs ? 'Joining...' : 'Join Company Team'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Wizard Step 1: Currency & Exchange Rate */}
          {creationStep === 1 && (
            <div className={styles.wizardCard}>
              <div className={styles.wizardHeaderRow}>
                <div className={styles.wizardCompanyBadge}>
                  <Building2 size={14} />
                  <span>{newWorkspaceName}</span>
                </div>
                <div className={styles.wizardStepIndicator}>
                  <span className={styles.wizardStepBadge}>1</span>
                  <span>Step 1 of 2: Currency & Rate</span>
                </div>
              </div>

              <div>
                <h2 className={styles.wizardStepTitle}>Primary Base Currency & Exchange Rate</h2>
                <p className={styles.wizardStepDesc}>
                  Select the primary reporting currency for <b>{newWorkspaceName}</b> and configure the conversion rate for automated USD/KHR receipt reconciliation.
                </p>
              </div>

              {/* Currency Selection Cards */}
              <div>
                <label className={styles.settingsLabel} style={{ marginBottom: '8px', display: 'block' }}>Primary Base Reporting Currency</label>
                <div className={styles.wizardCurrencyGrid}>
                  <div
                    className={`${styles.wizardCurrencyCard} ${newWorkspaceCurrency === 'KHR' ? styles.wizardCurrencyCardActive : ''}`}
                    onClick={() => setNewWorkspaceCurrency('KHR')}
                  >
                    <div className={styles.wizardCurrencyHeader}>
                      <div className={styles.wizardCurrencySymbol}>៛</div>
                      <input
                        type="radio"
                        checked={newWorkspaceCurrency === 'KHR'}
                        onChange={() => setNewWorkspaceCurrency('KHR')}
                        style={{ accentColor: '#7A222B' }}
                      />
                    </div>
                    <div className={styles.wizardCurrencyTitle}>Khmer Riel (KHR)</div>
                    <div className={styles.wizardCurrencyDesc}>
                      Cambodia standard reporting currency compliant with NBC & GDT tax ledger rules.
                    </div>
                  </div>

                  <div
                    className={`${styles.wizardCurrencyCard} ${newWorkspaceCurrency === 'USD' ? styles.wizardCurrencyCardActive : ''}`}
                    onClick={() => setNewWorkspaceCurrency('USD')}
                  >
                    <div className={styles.wizardCurrencyHeader}>
                      <div className={styles.wizardCurrencySymbol}>$</div>
                      <input
                        type="radio"
                        checked={newWorkspaceCurrency === 'USD'}
                        onChange={() => setNewWorkspaceCurrency('USD')}
                        style={{ accentColor: '#7A222B' }}
                      />
                    </div>
                    <div className={styles.wizardCurrencyTitle}>US Dollar (USD)</div>
                    <div className={styles.wizardCurrencyDesc}>
                      Master book tracked in US Dollars. Khmer Riel cash expenses convert at the active rate.
                    </div>
                  </div>
                </div>
              </div>

              {/* Exchange Rate Setting Box */}
              <div className={styles.wizardRateBox}>
                <div className={styles.wizardRateRow}>
                  <div>
                    <div className={styles.wizardRateLabel}>Active Conversion Rate</div>
                    <div style={{ fontSize: '12px', color: '#8C8075' }}>1 US Dollar = Riel equivalent</div>
                  </div>
                  <div className={styles.wizardRateInputWrap}>
                    <input
                      type="number"
                      className={styles.wizardRateInput}
                      value={newWorkspaceRate}
                      onChange={(e) => setNewWorkspaceRate(Math.max(1, parseFloat(e.target.value) || 4100))}
                      min="1"
                      step="10"
                    />
                    <span style={{ fontWeight: 800, color: '#7A222B' }}>៛</span>
                  </div>
                </div>

              </div>

              {/* Wizard Nav */}
              <div className={styles.wizardNavRow}>
                <button
                  type="button"
                  className={styles.wizardBackBtn}
                  onClick={() => setCreationStep(0)}
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className={styles.wizardNextBtn}
                  onClick={() => setCreationStep(2)}
                >
                  Next: Categories & Depts <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Wizard Step 2: Categories & Departments */}
          {creationStep === 2 && (
            <div className={styles.wizardCard}>
              <div className={styles.wizardHeaderRow}>
                <div className={styles.wizardCompanyBadge}>
                  <Building2 size={14} />
                  <span>{newWorkspaceName}</span>
                </div>
                <div className={styles.wizardStepIndicator}>
                  <span className={styles.wizardStepBadge}>2</span>
                  <span>Step 2 of 2: Categories & Depts</span>
                </div>
              </div>

              <div>
                <h2 className={styles.wizardStepTitle}>Expense Categories & Departments</h2>
                <p className={styles.wizardStepDesc}>
                  Customize the categories and departments your team can select when filing expense receipts. You can add or remove items now, and adjust them anytime in Settings.
                </p>
              </div>

              {/* Section A: Expense Categories */}
              <div className={styles.wizardChipSection}>
                <div className={styles.wizardSectionHeading}>
                  <span>Expense Categories ({wizardCategories.length})</span>
                  <span style={{ fontSize: '11px', color: '#8C8075', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Tap <X size={11} style={{ display: 'inline' }} /> to remove
                  </span>
                </div>

                <div className={styles.wizardChipsContainer}>
                  {wizardCategories.map((cat) => (
                    <div key={cat} className={styles.wizardChip}>
                      <span>{cat}</span>
                      <button
                        type="button"
                        className={styles.wizardChipRemove}
                        onClick={() => handleWizardRemoveCategory(cat)}
                        title={`Remove ${cat}`}
                        aria-label={`Remove ${cat}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.wizardAddChipRow}>
                  <input
                    type="text"
                    className={styles.wizardAddChipInput}
                    placeholder="Add category (e.g. Client Entertainment, Marketing)..."
                    value={wizardCategoryInput}
                    onChange={(e) => setWizardCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleWizardAddCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.wizardAddChipBtn}
                    onClick={handleWizardAddCategory}
                  >
                    <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Add
                  </button>
                </div>
              </div>

              {/* Section B: Company Departments */}
              <div className={styles.wizardChipSection}>
                <div className={styles.wizardSectionHeading}>
                  <span>Company Departments ({wizardDepartments.length})</span>
                  <span style={{ fontSize: '11px', color: '#8C8075', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Tap <X size={11} style={{ display: 'inline' }} /> to remove
                  </span>
                </div>

                <div className={styles.wizardChipsContainer}>
                  {wizardDepartments.map((dept) => (
                    <div key={dept} className={styles.wizardChip}>
                      <span>{dept}</span>
                      <button
                        type="button"
                        className={styles.wizardChipRemove}
                        onClick={() => handleWizardRemoveDepartment(dept)}
                        title={`Remove ${dept}`}
                        aria-label={`Remove ${dept}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.wizardAddChipRow}>
                  <input
                    type="text"
                    className={styles.wizardAddChipInput}
                    placeholder="Add department (e.g. Logistics, Customer Support)..."
                    value={wizardDeptInput}
                    onChange={(e) => setWizardDeptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleWizardAddDepartment();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.wizardAddChipBtn}
                    onClick={handleWizardAddDepartment}
                  >
                    <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Add
                  </button>
                </div>
              </div>

              {/* Wizard Nav */}
              <div className={styles.wizardNavRow}>
                <button
                  type="button"
                  className={styles.wizardBackBtn}
                  onClick={() => setCreationStep(1)}
                  disabled={isCreatingWs}
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className={styles.wizardNextBtn}
                  onClick={() => handleCreateWorkspace()}
                  disabled={isCreatingWs || wizardCategories.length === 0 || wizardDepartments.length === 0}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {isCreatingWs ? (
                    'Creating Workspace...'
                  ) : (
                    <>
                      <Rocket size={16} />
                      <span>Complete & Launch Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.onboardingSignOutBtn}
            >
              <LogOut size={14} />
              <span>Sign out ({currentUser.email})</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.desktopShell}>
        {/* Royal Burgundy Sidebar (Responsive Drawer on Mobile) */}
        <aside className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.sidebarOpen : ''}`}>
          <div>
            {/* Brand Header */}
            <div className={styles.brandHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.logoBox}>
                  <ReceiptIcon size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div className={styles.brandName}>Komnottra</div>
                  <div className={styles.brandKhmer}>កំណត់ត្រា</div>
                </div>
              </div>
              <button
                type="button"
                className={styles.mobileDrawerCloseBtn}
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>

            {/* Role-Specific Banner */}
            {currentUser?.role === 'OWNER' ? (
              <div
                style={{
                  margin: '10px 14px 14px 14px',
                  padding: '8px 12px',
                  background: 'rgba(232, 186, 90, 0.15)',
                  border: '1px solid rgba(232, 186, 90, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const code = currentUser?.inviteCode || workspaceSettings.inviteCode;
                  if (code) {
                    navigator.clipboard.writeText(code);
                    alert(`Invite Code "${code}" copied! Share with your staff so they can sign up.`);
                  } else {
                    alert('Invite code is being generated or synchronized.');
                  }
                }}
              >
                <div style={{ fontSize: '10px', color: '#E8BA5A', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><LinkIcon size={12} /> Team Invite Code</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Copy size={11} /> Copy</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.05em', marginTop: '2px' }}>
                  {currentUser?.inviteCode || workspaceSettings.inviteCode || '—'}
                </div>
              </div>
            ) : (
              <div
                style={{
                  margin: '10px 14px 14px 14px',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#E8BA5A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <User size={11} /> Staff Member Portal
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  {currentUser?.department ? `${currentUser.department} Dept` : 'General Staff'}
                </div>
              </div>
            )}

            {/* Big Gold Scan CTA */}
            <button
              className={styles.btnScanGold}
              onClick={() => {
                setActiveScreen('scan');
                setIsMobileSidebarOpen(false);
              }}
            >
              <Camera size={18} />
              <span>{t.scanReceipt}</span>
            </button>

            {/* Nav Menu */}
            <nav className={styles.navMenu}>
              <div
                className={`${styles.navMenuItem} ${activeScreen === 'home' ? styles.navMenuItemActive : ''}`}
                onClick={() => {
                  setActiveScreen('home');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className={styles.navItemLeft}>
                  <Home size={16} /> {t.home}
                </div>
              </div>
              <div
                className={`${styles.navMenuItem} ${activeScreen === 'analytics' ? styles.navMenuItemActive : ''}`}
                onClick={() => {
                  setActiveScreen('analytics');
                  fetchAnalytics();
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className={styles.navItemLeft}>
                  <BarChart3 size={16} /> Analytics &amp; Runway
                </div>
              </div>
              <div
                className={`${styles.navMenuItem} ${activeScreen === 'chatbot' ? styles.navMenuItemActive : ''}`}
                onClick={() => {
                  if (currentUser?.role === 'OWNER') {
                    setActiveScreen('chatbot');
                  } else {
                    alert('The Chatbot is reserved exclusively for Company Owners.');
                  }
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className={styles.navItemLeft}>
                  <Bot size={16} /> {t.chatbot}
                </div>
                <span style={{ fontSize: '10px', background: '#E8BA5A', color: '#7A222B', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>
                  AI
                </span>
              </div>
              <div
                className={`${styles.navMenuItem} ${activeScreen === 'approvals' ? styles.navMenuItemActive : ''}`}
                onClick={() => {
                  if (currentUser?.role === 'OWNER') {
                    setActiveScreen('approvals');
                  } else {
                    alert('Approvals are reserved for Company Finance Leads. Your submitted receipts are currently pending review.');
                  }
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className={styles.navItemLeft}>
                  <CheckSquare size={16} /> {t.approvals}
                </div>
                {currentUser?.role === 'OWNER' && (
                  <span className={styles.badgePillCounter}>{approvalQueue.length}</span>
                )}
              </div>
              <div
                className={`${styles.navMenuItem} ${activeScreen === 'reports' ? styles.navMenuItemActive : ''}`}
                onClick={() => {
                  setActiveScreen('reports');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className={styles.navItemLeft}>
                  <FileSpreadsheet size={16} /> {t.reports}
                </div>
              </div>
              <div
                className={`${styles.navMenuItem} ${activeScreen === 'archive' ? styles.navMenuItemActive : ''}`}
                onClick={() => {
                  setActiveScreen('archive');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className={styles.navItemLeft}>
                  <ArchiveIcon size={16} /> {t.archive}
                </div>
              </div>
              <div
                className={`${styles.navMenuItem} ${activeScreen === 'team' ? styles.navMenuItemActive : ''}`}
                onClick={() => {
                  setActiveScreen('team');
                  fetchMembers();
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className={styles.navItemLeft}>
                  <Users size={16} /> Team & Members
                </div>
              </div>
            </nav>
          </div>

          {/* Sidebar Bottom Footer */}
          <div className={styles.sidebarFooter}>
            {/* Mobile-Only: Profile Card placed above Settings in slide-out menu */}
            <div className={styles.mobileProfileInMenu}>
              <div className={styles.mobileProfileCardInner}>
                <div className={styles.mobileProfileAvatar}>
                  {getUserInitials(currentUser)}
                </div>
                <div className={styles.mobileProfileInfo}>
                  <div className={styles.mobileProfileName}>
                    {currentUser?.name || currentUser?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className={styles.mobileProfileRole}>
                    {currentUser?.role === 'OWNER' ? 'Owner' : 'Staff Member'}
                  </div>
                  <div className={styles.mobileProfileEmail}>
                    {currentUser?.email}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.mobileProfileLogoutBtn}
                  onClick={handleLogout}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>

            <div
              className={`${styles.settingsLink} ${activeScreen === 'settings' ? styles.settingsLinkActive : ''}`}
              onClick={() => {
                if (currentUser?.role === 'OWNER') {
                  setActiveScreen('settings');
                } else {
                  alert('Workspace policies & settings can only be edited by Company Owners.');
                }
                setIsMobileSidebarOpen(false);
              }}
            >
              <Settings size={16} /> {t.settings}
            </div>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className={styles.mainViewport}>
          {/* Top Page Header */}
          <header className={styles.pageHeader}>
            <div className={styles.headerLeftArea}>
              <button
                type="button"
                className={styles.mobileMenuToggle}
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={22} />
              </button>
            </div>

            <div className={styles.headerTitles}>
              <div className={styles.headerDate}>{currentFullDate}</div>
              <h1 className={styles.headerTitle}>
                {t.greeting}, {currentUser?.name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User'}
              </h1>
            </div>

            <div className={styles.headerRightControls}>
              {/* Currency Toggle Switch (Riel / USD) */}
              <div className={styles.headerCurrencySwitch} title="Toggle base reporting currency">
                <button
                  type="button"
                  className={`${styles.headerCurrBtn} ${workspaceSettings.baseCurrency === 'KHR' ? styles.headerCurrBtnActive : ''}`}
                  onClick={() => handleToggleBaseCurrency('KHR')}
                >
                  <span className={styles.headerCurrSymbol}>៛</span>
                  <span>Riel</span>
                </button>
                <button
                  type="button"
                  className={`${styles.headerCurrBtn} ${workspaceSettings.baseCurrency === 'USD' ? styles.headerCurrBtnActive : ''}`}
                  onClick={() => handleToggleBaseCurrency('USD')}
                >
                  <span className={styles.headerCurrSymbol}>$</span>
                  <span>USD</span>
                </button>
              </div>

              {/* Live Exchange Rate Input */}
              <div className={styles.headerRateBox} title="Active exchange rate (KHR per 1 USD)">
                <span className={styles.headerRateLabel}>1$ =</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  className={styles.headerRateInput}
                  value={headerRateInput}
                  onChange={(e) => {
                    setHeaderRateInput(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setWorkspaceSettings((prev) => ({ ...prev, exchangeRate: val }));
                    }
                  }}
                  onBlur={() => {
                    const val = parseFloat(headerRateInput);
                    if (!isNaN(val) && val > 0) {
                      handleUpdateExchangeRate(val);
                    } else {
                      setHeaderRateInput(String(workspaceSettings.exchangeRate || 4100));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                />
                <span className={styles.headerRateUnit}>៛</span>
              </div>

              {/* Desktop-Only: Profile Pill & Dropdown */}
              <div className={styles.desktopProfileWrapper} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={styles.userProfileBtn}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className={styles.userAvatar} style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                    {getUserInitials(currentUser)}
                  </div>
                  <div className={styles.userProfileMeta}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F1916' }}>
                      {currentUser?.name || currentUser?.email?.split('@')[0] || 'User'}
                    </span>
                    <span style={{ fontSize: '10px', color: currentUser?.role === 'OWNER' ? '#7A222B' : '#0D9488', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {currentUser?.role === 'OWNER' ? <Shield size={10} /> : <User size={10} />}
                      {currentUser?.role === 'OWNER' ? 'Owner' : 'Staff'}
                    </span>
                  </div>
                </button>

                  {showUserMenu && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '46px',
                        background: '#FFFFFF',
                        border: '1px solid #EFE8DE',
                        borderRadius: '16px',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                        width: '260px',
                        padding: '14px',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ borderBottom: '1px solid #EFE8DE', paddingBottom: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#8C8075' }}>Signed in with Google</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1F1916' }}>{currentUser?.email}</div>
                        <div style={{ fontSize: '11px', color: '#7A222B', marginTop: '2px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Building2 size={12} /> {currentUser?.workspaceName}
                        </div>
                        {currentUser?.inviteCode && (
                          <div
                            style={{
                              marginTop: '8px',
                              background: '#FFF8E6',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#B45309',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              navigator.clipboard.writeText(currentUser.inviteCode || '');
                              alert(`Invite Code ${currentUser.inviteCode} copied! Share with employees to join.`);
                            }}
                          >
                            <span>Code: {currentUser.inviteCode}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Copy size={12} /> Copy</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                        <button
                          type="button"
                          style={{
                            textAlign: 'left',
                            padding: '8px 10px',
                            background: activeScreen === 'team' ? '#FAF5F5' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#1F1916',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          onClick={() => {
                            setActiveScreen('team');
                            fetchMembers();
                            setShowUserMenu(false);
                          }}
                        >
                          <Users size={14} /> Manage Team & Invites
                        </button>

                        <button
                          type="button"
                          style={{
                            textAlign: 'left',
                            padding: '8px 10px',
                            background: activeScreen === 'settings' ? '#FAF5F5' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#1F1916',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          onClick={() => {
                            if (currentUser?.role === 'OWNER') {
                              setActiveScreen('settings');
                            } else {
                              alert('Workspace settings are managed by Company Owners.');
                            }
                            setShowUserMenu(false);
                          }}
                        >
                          <Settings size={14} /> Workspace Settings
                        </button>
                      </div>

                      <div style={{ borderTop: '1px solid #EFE8DE', paddingTop: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 10px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: '#DC2626',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          onClick={handleLogout}
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* SCREEN 1: DASHBOARD (HOME) */}
            {activeScreen === 'home' && (
              <div className={styles.homeDashboardContainer}>
                {/* Top Section: Left (Hero Spend + Actions) & Right (Metrics + Category Breakdown) */}
                <div className={styles.dashboardTopGrid}>
                  {/* Left Column */}
                  <div className={styles.dashboardLeft}>
                    <div className={styles.heroSpendCard}>
                      <div className={styles.heroLabel}>
                        {currentMonthYear} SPENDING ({isBaseUsd ? 'USD BASE' : 'KHR BASE'})
                      </div>
                      <div className={styles.heroAmount}>
                        {isBaseUsd
                          ? `$${totalSpendUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${totalSpendKhr.toLocaleString()} ៛`}
                      </div>
                      <div className={styles.heroBottomRow}>
                        <div className={styles.heroPeriod}>{currentUser?.workspaceName || 'Active Workspace'}</div>
                      </div>
                    </div>

                    <div className={styles.actionCardsRow}>
                      <div className={styles.actionCard} onClick={() => setActiveScreen('scan')}>
                        <div className={styles.actionIconBubble}>
                          <Camera size={20} color="#7A222B" />
                        </div>
                        <div>
                          <div className={styles.actionTitle}>{t.scanReceipt}</div>
                          <div className={styles.actionDesc}>{t.scanDesc}</div>
                        </div>
                      </div>
                      <div className={styles.actionCard} onClick={() => setActiveScreen('scan')}>
                        <div className={styles.actionIconBubble}>
                          <Upload size={20} color="#7A222B" />
                        </div>
                        <div>
                          <div className={styles.actionTitle}>{t.uploadFiles}</div>
                          <div className={styles.actionDesc}>{t.uploadDesc}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className={styles.dashboardRight}>
                    <div className={styles.metricsRow}>
                      <div className={styles.metricCard}>
                        <span className={styles.metricTitle}>Approved Spend</span>
                        <span className={styles.metricNum} style={{ color: '#7A222B' }}>
                          {isBaseUsd ? `$${totalSpendUsd.toFixed(0)}` : `${Math.round(totalSpendKhr).toLocaleString()} ៛`}
                        </span>
                        <span className={styles.metricSub}>{approvedCount} claims approved</span>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricTitle}>Approved Revenue</span>
                        <span className={styles.metricNum} style={{ color: '#15803D' }}>
                          {isBaseUsd ? `$${totalIncomeUsd.toFixed(0)}` : `${Math.round(totalIncomeKhr).toLocaleString()} ៛`}
                        </span>
                        <span className={styles.metricSub}>{approvedIncomes.length} client payments</span>
                      </div>
                      <div
                        className={styles.metricCard}
                        style={{ cursor: 'pointer', border: approvalQueue.length > 0 ? '1px solid #FED7AA' : undefined }}
                        onClick={() => setActiveScreen('approvals')}
                        title="Click to view Approvals queue"
                      >
                        <span className={styles.metricTitle}>{t.toReview}</span>
                        <span className={styles.metricNum} style={{ color: approvalQueue.length > 0 ? '#D97706' : '#15803D' }}>
                          {approvalQueue.length}
                        </span>
                        <span className={styles.metricSub} style={{ color: '#8C8075' }}>
                          {approvalQueue.length === 0
                            ? 'Zero pending'
                            : `${pendingReceipts.length} ${pendingReceipts.length === 1 ? 'expense' : 'expenses'} · ${pendingIncomes.length} ${pendingIncomes.length === 1 ? 'income' : 'incomes'}`}
                        </span>
                      </div>
                    </div>

                    <div className={styles.categoryCard}>
                      <div className={styles.categoryTitle}>{t.spendingByCategory}</div>

                      <div className={styles.donutVisualArea}>
                        <div className={styles.donutCircleMock} style={{ background: dynamicDonutBg }}>
                          <div className={styles.donutCenterHole}>
                            <span className={styles.donutCenterNum}>
                              {approvedReceipts.length === 0
                                ? (isBaseUsd ? '$0.00' : '0 ៛')
                                : isBaseUsd
                                ? totalSpendUsd >= 1000
                                  ? `$${(totalSpendUsd / 1000).toFixed(1)}k`
                                  : `$${totalSpendUsd.toFixed(2)}`
                                : totalSpendKhr >= 1000000
                                ? `${(totalSpendKhr / 1000000).toFixed(2)}M`
                                : totalSpendKhr > 0
                                ? `${(totalSpendKhr / 1000).toFixed(0)}k ៛`
                                : '0 ៛'}
                            </span>
                            <span className={styles.donutCenterSub}>
                              {approvedReceipts.length === 0
                                ? 'Zero spend'
                                : isBaseUsd
                                ? 'USD Base Total'
                                : t.rielTotal}
                            </span>
                          </div>
                        </div>

                        <div className={styles.categoryLegend}>
                          {currentCategories.map((cat, idx) => {
                            const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                            return (
                              <div key={cat} className={styles.legendRow}>
                                <div className={styles.legendLeft}>
                                  <div className={styles.legendDot} style={{ background: color }}></div>
                                  <span>{cat}</span>
                                </div>
                                <span className={styles.legendPct}>{getCategoryPct(cat)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Full-Width Recent Approved Transactions Card */}
                <div className={styles.recentCard}>
                  <div className={styles.recentCardHeader}>
                    <div>
                      <div className={styles.recentTitle}>Recent Approved Transactions</div>
                      <div style={{ fontSize: '11px', color: '#8C8075', marginTop: '2px' }}>
                        Verified inflows &amp; outflows · Unapproved submissions remain in Approvals
                      </div>
                    </div>
                    <div className={styles.seeAllLink} onClick={() => setActiveScreen('reports')}>
                      {t.seeAll}
                    </div>
                  </div>

                  <div className={styles.recentTableWrapper}>
                    {approvedUnifiedTransactions.length > 0 && (
                      <div className={styles.recentTableHeader}>
                        <div>TRANSACTION &amp; COUNTERPARTY</div>
                        <div>DATE</div>
                        <div>CATEGORY</div>
                        <div className={styles.recentTableHeaderColRight}>AMOUNT</div>
                        <div className={styles.recentTableHeaderColCenter}>STATUS</div>
                        <div></div>
                      </div>
                    )}

                    <div className={styles.receiptItemList}>
                      {approvedUnifiedTransactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#8C8075' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                            <CheckCheck size={38} color="#8C8075" />
                          </div>
                          <div style={{ fontWeight: 700, color: '#1F1916', fontSize: '15px' }}>
                            {approvalQueue.length > 0 ? `${approvalQueue.length} Pending Submissions Awaiting Approval` : 'No Approved Transactions Yet'}
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '6px', maxWidth: '420px', margin: '6px auto 0 auto', lineHeight: 1.5 }}>
                            {approvalQueue.length > 0
                              ? `You have ${approvalQueue.length} items waiting in the Approvals queue. Only approved receipts and invoices land on the home dashboard and reports.`
                              : `Snap a receipt or record client income. Submissions go to the Approvals tab before landing in your official statements.`}
                          </div>
                          {approvalQueue.length > 0 ? (
                            <button
                              type="button"
                              className={styles.btnApproveReport}
                              style={{ margin: '16px auto 0 auto', width: 'auto', padding: '8px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => setActiveScreen('approvals')}
                            >
                              <CheckSquare size={14} /> Review Approvals ({approvalQueue.length})
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.btnApproveReport}
                              style={{ margin: '16px auto 0 auto', width: 'auto', padding: '8px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => setActiveScreen('scan')}
                            >
                              <Camera size={14} /> Scan First Receipt
                            </button>
                          )}
                        </div>
                      ) : (
                        approvedUnifiedTransactions.slice(0, 6).map((tx) => (
                          <div
                            key={tx.id}
                            className={styles.receiptItemRow}
                            onClick={() => {
                              if (tx.itemType === 'INCOME') {
                                handleOpenEditIncome(tx.rawItem);
                              } else {
                                handleOpenEditReceipt(tx.rawItem);
                              }
                            }}
                            title="Click to view details and inspect record"
                          >
                            {/* Col 1: Type icon, Counterparty & Description */}
                            <div className={styles.receiptItemLeft}>
                              <div
                                className={styles.merchantIcon}
                                style={{
                                  color: tx.itemType === 'INCOME' ? '#15803D' : '#7A222B',
                                  background: tx.itemType === 'INCOME' ? '#DCFCE7' : '#FDF2F2',
                                }}
                              >
                                {tx.itemType === 'INCOME' ? (
                                  <ArrowDownLeft size={18} />
                                ) : tx.party.includes('PassApp') ? (
                                  <Car size={18} />
                                ) : tx.party.includes('Shop') ? (
                                  <Store size={18} />
                                ) : tx.party.includes('Supermarket') ? (
                                  <ShoppingBag size={18} />
                                ) : (
                                  <Coffee size={18} />
                                )}
                              </div>
                              <div className={styles.merchantInfo}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 800, color: '#1F1916' }}>{tx.party}</span>
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      background: tx.itemType === 'INCOME' ? '#DCFCE7' : '#FEE2E2',
                                      color: tx.itemType === 'INCOME' ? '#15803D' : '#991B1B',
                                    }}
                                  >
                                    {tx.itemType === 'INCOME' ? 'INFLOW' : 'CLAIM'}
                                  </span>
                                </div>
                                <div className={styles.receiptMeta}>{tx.description || tx.refNo || 'Verified Transaction'}</div>
                              </div>
                            </div>

                            {/* Col 2: Date */}
                            <div className={styles.receiptDateCol}>
                              {tx.date || '—'}
                            </div>

                            {/* Col 3: Category Badge */}
                            <div>
                              <span className={styles.receiptCategoryBadge}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: getCategoryDotColor(tx.category), flexShrink: 0 }} />
                                {tx.category || 'General'}
                              </span>
                            </div>

                            {/* Col 4: Amount */}
                            <div
                              className={styles.receiptAmountCol}
                              style={{
                                color: tx.itemType === 'INCOME' ? '#15803D' : '#1F1916',
                                fontWeight: 800,
                              }}
                            >
                              {tx.itemType === 'INCOME' ? '+' : '-'}
                              {tx.currency === 'USD' ? `$${Number(tx.total).toFixed(2)}` : `${Number(tx.total).toLocaleString()} ៛`}
                            </div>

                            {/* Col 5: Status Badge */}
                            <div className={styles.receiptStatusCol}>
                              <span className={`${styles.statusBadge} ${styles.statusApproved}`}>
                                {tx.status}
                              </span>
                            </div>

                            {/* Col 6: Chevron */}
                            <div className={styles.receiptRowChevron}>
                              <ChevronRight size={16} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 2: SCAN & BATCH QUEUE */}
            {activeScreen === 'scan' && (
              <div className={styles.batchScanContainer}>
                {/* Header */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#8C8075', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    FAST NATIVE CAMERA &amp; MULTI-RECEIPT SCANNER
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1F1916', margin: 0 }}>
                      {t.scanReceipt}
                    </h2>
                  </div>
                </div>

                {/* Hidden File / Camera Inputs */}
                <input
                  ref={mobileCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleAddFilesToStage(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleAddFilesToStage(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />

                {/* Batch Processing Overlay */}
                {isBatchProcessing && (
                  <div className={styles.batchProcessingOverlay}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 size={26} color="#B45309" className={styles.spinning} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-primary)', fontSize: '18px', fontWeight: 800, color: '#1F1916' }}>
                        Starting extraction for {batchProgress.total} receipt{batchProgress.total > 1 ? 's' : ''}...
                      </div>
                      <div style={{ fontSize: '13px', color: '#8C8075', marginTop: '4px' }}>
                        Processing receipt {batchProgress.current} of {batchProgress.total}
                      </div>
                    </div>
                    <div className={styles.batchProgressBarWrapper}>
                      <div
                        className={styles.batchProgressFill}
                        style={{ width: `${Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* 2-Column Split: Stacked Camera & Gallery on Left, Captured Receipts Tray on Right */}
                {!isBatchProcessing && (
                  <div className={styles.scanLayoutSplit}>
                    {/* Left Column: Stacked Action Cards */}
                    <div className={styles.scanSourcesColumn}>
                      {/* Action 1: Adaptive Camera (Phone Camera on mobile, Laptop Webcam on PC) */}
                      <div
                        className={styles.nativeCameraCard}
                        onClick={handleTriggerCamera}
                      >
                        <div className={styles.cameraIconBubble}>
                          <Camera size={28} />
                        </div>
                        <div>
                          <div className={styles.cameraCardTitle}>
                            {isMobileDevice ? 'Take Photo with Phone Camera' : 'Snap with Laptop / PC Webcam'}
                          </div>
                          <div className={styles.cameraCardDesc}>
                            {isMobileDevice
                              ? "Opens your phone's native camera immediately in full resolution with auto-focus and flash. Zero lag."
                              : "Use your computer's webcam to take clear receipt snapshots directly into your queue with alignment guide."}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.btnCameraPrimary}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriggerCamera();
                          }}
                        >
                          <Camera size={16} /> {isMobileDevice ? 'Open Camera & Snap' : 'Open Laptop Webcam'}
                        </button>
                      </div>

                      {/* Action 2: Gallery & Document Upload */}
                      <div
                        className={styles.galleryCard}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className={styles.galleryIconBubble}>
                          <Upload size={28} />
                        </div>
                        <div>
                          <div className={styles.galleryCardTitle}>Pick from Photos / Gallery</div>
                          <div className={styles.galleryCardDesc}>
                            Select multiple receipt photos, KHQR payment screenshots, or PDF tax invoices from your device.
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.btnGallerySecondary}
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          <Upload size={16} /> Browse Multiple Files
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Captured Receipts Tray */}
                    <div className={styles.scanTrayColumn}>
                      <div className={styles.stagedTrayCard}>
                        <div className={styles.stagedTrayHeader}>
                          <div className={styles.stagedTrayTitle}>
                            <CheckCircle2 size={18} color="#15803D" />
                            <span>Captured Receipts Tray</span>
                            <span className={styles.stagedBadgeCount}>{stagedReceipts.length}</span>
                          </div>
                          {stagedReceipts.length > 0 && (
                            <button
                              type="button"
                              className={styles.btnClearStaged}
                              onClick={handleClearStaged}
                            >
                              Clear All ({stagedReceipts.length})
                            </button>
                          )}
                        </div>

                        {stagedReceipts.length === 0 ? (
                          <div className={styles.stagedEmptyCard}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FBF7F0', border: '1px solid #EFE8DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Receipt size={26} color="#7A222B" />
                            </div>
                            <div className={styles.stagedEmptyTitle}>No Receipts in Queue Yet</div>
                            <div className={styles.stagedEmptySub}>
                              Snap photos with your camera or pick files on the left. Captured receipts will queue up here for one-click batch AI extraction!
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={styles.stagedGrid}>
                              {stagedReceipts.map((item, idx) => (
                                <div key={item.id} className={styles.stagedThumbItem}>
                                  <div className={styles.stagedThumbMedia}>
                                    {item.previewUrl ? (
                                      <img src={item.previewUrl} alt={item.name} className={styles.stagedThumbImg} />
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#7A222B' }}>
                                        <FileText size={32} />
                                        <span style={{ fontSize: '10px', fontWeight: 800 }}>PDF</span>
                                      </div>
                                    )}
                                    <span className={styles.stagedThumbBadge}>#{idx + 1}</span>
                                    <button
                                      type="button"
                                      className={styles.stagedThumbRemove}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveStaged(item.id);
                                      }}
                                      title="Remove photo"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                  <div className={styles.stagedThumbMeta}>
                                    <div className={styles.stagedThumbName} title={item.name}>{item.name}</div>
                                    <div>
                                      <span className={styles.stagedThumbSize}>{formatFileSize(item.size)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className={styles.stagedBottomActions}>
                              <div className={styles.stagedAddMoreRow}>
                                <button
                                  type="button"
                                  className={styles.btnSnapAnother}
                                  onClick={handleTriggerCamera}
                                >
                                  <Camera size={14} /> + Snap Another
                                </button>
                                <button
                                  type="button"
                                  className={styles.btnSnapAnother}
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload size={14} /> + Add More
                                </button>
                              </div>

                              <button
                                type="button"
                                className={styles.btnExtractAll}
                                onClick={handleProcessBatch}
                                disabled={isBatchProcessing}
                              >
                                Extract all receipts
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Laptop Webcam Capture Modal (for PC / Laptops) */}
                {isWebcamModalOpen && (
                  <div className={styles.webcamModalBackdrop}>
                    <div className={styles.webcamModalContent}>
                      <div className={styles.webcamModalHeader}>
                        <div className={styles.webcamModalTitle}>
                          <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#FAF1EB', border: '1px solid #EFE8DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Camera size={19} color="#7A222B" />
                          </div>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1F1916', lineHeight: 1.2 }}>Laptop Webcam Snapshot</div>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: '#8C8075', marginTop: '2px' }}>Align receipt in frame and snap to add to your tray</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.webcamModalClose}
                          onClick={handleCloseWebcamModal}
                          title="Close Camera"
                          aria-label="Close Camera"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className={styles.webcamModalViewfinder}>
                        <video ref={webcamVideoRef} autoPlay playsInline muted className={styles.webcamModalVideo} />
                        <div className={styles.webcamGuideBox}>
                          <div className={styles.webcamGuideLabel}>
                            <Camera size={13} /> Hold receipt inside guide and hold still
                          </div>
                        </div>
                        {lastSnappedNotice && (
                          <div className={styles.webcamSnappedNotice}>
                            <CheckCircle2 size={15} /> {lastSnappedNotice}
                          </div>
                        )}
                        {webcamError && (
                          <div style={{ position: 'absolute', background: 'rgba(220, 38, 38, 0.9)', color: '#FFF', padding: '12px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, maxWidth: '80%', textAlign: 'center' }}>
                            {webcamError}
                          </div>
                        )}
                      </div>

                      <div className={styles.webcamModalFooter}>
                        <button
                          type="button"
                          className={styles.btnWebcamSnap}
                          onClick={handleSnapWebcamFrame}
                          disabled={!!webcamError}
                        >
                          <Camera size={18} /> Snap Photo (#{stagedReceipts.length + 1})
                        </button>
                        <button
                          type="button"
                          className={styles.btnWebcamDone}
                          onClick={handleCloseWebcamModal}
                        >
                          <Check size={16} /> Done ({stagedReceipts.length} in Tray)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SCREEN 3: REVIEW RECEIPT */}
            {activeScreen === 'review' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <div
                      style={{ fontSize: '11px', fontWeight: 700, color: '#8C8075', letterSpacing: '0.08em', marginBottom: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => setActiveScreen('scan')}
                    >
                      <ChevronLeft size={13} /> BACK TO SCAN
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1F1916' }}>
                      {t.reviewReceipt}
                    </h2>
                  </div>
                  {fieldsNeedingCheckCount > 0 ? (
                    <div className={styles.warningPrompt}>
                      <AlertTriangle size={14} /> {fieldsNeedingCheckCount} {t.fieldsNeedCheck}
                    </div>
                  ) : (
                    <div className={styles.warningPrompt} style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' }}>
                      <CheckSquare size={14} /> All key fields verified
                    </div>
                  )}
                </div>

                <div className={styles.reviewScreenGrid}>
                  <div className={styles.tornReceiptPaper}>
                    {reviewForm.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={reviewForm.imageUrl}
                        alt={reviewForm.vendor || 'Scanned Receipt'}
                        style={{ width: '100%', maxHeight: '440px', objectFit: 'contain' }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes('/uploads/') && !target.src.includes('/api/uploads/')) {
                            target.src = target.src.replace('/uploads/', '/api/uploads/');
                          }
                        }}
                      />
                    ) : (
                      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8C8075', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Receipt size={48} color="#B45309" />
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#1F1916' }}>Receipt Document</div>
                        <div style={{ fontSize: '12px' }}>Review extracted receipt details on the right</div>
                      </div>
                    )}
                  </div>

                  <div className={styles.reviewFormCard}>
                    <div className={styles.confidenceBanner}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={styles.confidenceScore}>{reviewForm.confidence}%</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>Overall confidence</div>
                          <div style={{ fontSize: '11px', color: '#8C8075' }}>{clearFieldsCount} of 8 fields read clearly</div>
                        </div>
                      </div>
                      {reviewForm.category.toLowerCase().includes('transport') ? (
                        <Car size={20} color="#7A222B" />
                      ) : reviewForm.category.toLowerCase().includes('util') ? (
                        <Zap size={20} color="#7A222B" />
                      ) : reviewForm.category.toLowerCase().includes('meal') ? (
                        <ShoppingBag size={20} color="#7A222B" />
                      ) : (
                        <Store size={20} color="#7A222B" />
                      )}
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formFieldGroup}>
                        <label>Vendor</label>
                        <input
                          className={styles.warmInput}
                          value={reviewForm.vendor}
                          placeholder="Vendor or merchant name"
                          onChange={(e) => setReviewForm({ ...reviewForm, vendor: e.target.value })}
                        />
                      </div>
                      <div className={styles.formFieldGroup}>
                        <label>Date</label>
                        <input
                          className={styles.warmInput}
                          value={reviewForm.date}
                          placeholder="DD/MM/YYYY"
                          onChange={(e) => setReviewForm({ ...reviewForm, date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formFieldGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <label>Total amount</label>
                          {isAmountMissing && (
                            <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={12} /> Please enter amount
                            </span>
                          )}
                        </div>
                        <input
                          className={`${styles.warmInput} ${isAmountMissing ? styles.warmInputWarn : ''}`}
                          value={reviewForm.total}
                          placeholder="0.00"
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = parseFloat(val) || 0;
                            const autoVat = Math.round(num * 0.0909);
                            setReviewForm({ ...reviewForm, total: val, vat: autoVat.toString() });
                          }}
                        />
                        {isAmountMissing && (
                          <span style={{ fontSize: '10px', color: '#D97706' }}>Please enter receipt total amount</span>
                        )}
                      </div>
                      <div className={styles.formFieldGroup}>
                        <label>Currency</label>
                        <div className={styles.currencySegment}>
                          <button
                            className={`${styles.currBtn} ${reviewForm.currency === 'KHR' ? styles.currBtnActive : ''}`}
                            onClick={() => setReviewForm({ ...reviewForm, currency: 'KHR' })}
                          >
                            KHR ៛
                          </button>
                          <button
                            className={`${styles.currBtn} ${reviewForm.currency === 'USD' ? styles.currBtnActive : ''}`}
                            onClick={() => setReviewForm({ ...reviewForm, currency: 'USD' })}
                          >
                            USD $
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Dual Currency Conversion Banner for Single Review */}
                    {(() => {
                      const numTotal = parseFloat(reviewForm.total) || 0;
                      const isUsd = reviewForm.currency === 'USD';
                      const converted = isUsd ? Math.round(numTotal * exchangeRate) : numTotal / exchangeRate;
                      const formatted = isUsd
                        ? `${converted.toLocaleString()} ៛ KHR`
                        : `$${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
                      return (
                        <div style={{ background: '#FAF7F2', border: '1px solid #EFE8DE', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', fontSize: '12px' }}>
                          <span style={{ color: '#7A222B', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp size={13} /> {isUsd ? `$${numTotal.toFixed(2)} USD` : `${Math.round(numTotal).toLocaleString()} ៛ KHR`}
                          </span>
                          <span style={{ color: '#8C8075', display: 'inline-flex', alignItems: 'center' }}>
                            <ArrowRight size={13} />
                          </span>
                          <span style={{ fontWeight: 800, color: '#1F1916' }}>
                            ≈ {formatted} <span style={{ fontSize: '11px', color: '#8C8075', fontWeight: 500 }}>(@ {exchangeRate.toLocaleString()} rate)</span>
                          </span>
                        </div>
                      );
                    })()}

                    <div className={styles.formRow}>
                      <div className={styles.formFieldGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <label>VAT (10% included)</label>
                        </div>
                        <input
                          className={styles.warmInput}
                          value={reviewForm.vat}
                          placeholder="0"
                          onChange={(e) => setReviewForm({ ...reviewForm, vat: e.target.value })}
                        />
                      </div>
                      <div className={styles.formFieldGroup}>
                        <label>Vendor TIN</label>
                        <input
                          className={styles.warmInput}
                          value={reviewForm.vendorTin}
                          placeholder="e.g. K001-100234567"
                          onChange={(e) => setReviewForm({ ...reviewForm, vendorTin: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formFieldGroup}>
                        <label>Category</label>
                        <select
                          className={styles.warmInput}
                          value={reviewForm.category}
                          onChange={(e) => setReviewForm({ ...reviewForm, category: e.target.value })}
                        >
                          {workspaceSettings.expenseCodes.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formFieldGroup}>
                        <label>Department</label>
                        <select
                          className={styles.warmInput}
                          value={reviewForm.department}
                          onChange={(e) => setReviewForm({ ...reviewForm, department: e.target.value })}
                        >
                          {workspaceSettings.departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formFieldGroup} style={{ flex: 1 }}>
                        <label>Note</label>
                        <input
                          className={styles.warmInput}
                          value={reviewForm.note}
                          placeholder="Purpose / description"
                          onChange={(e) => setReviewForm({ ...reviewForm, note: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className={styles.reviewActionsRow}>
                      <button className={styles.btnRetake} onClick={() => setActiveScreen('scan')}>
                        {t.retake}
                      </button>
                      <button className={styles.btnApproveReport} onClick={handleApproveAndSave}>
                        {t.approveAddReport}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN: BATCH REVIEW & INSPECTION GALLERY */}
            {activeScreen === 'batch-review' && (
              <div className={styles.batchReviewContainer}>
                {/* Header Card */}
                <div className={styles.batchReviewHeaderCard}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, marginBottom: '8px' }}>
                      DRAFT RECEIPTS ({parsedBatchReceipts.length})
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '24px', fontWeight: 800, color: '#1F1916', margin: 0 }}>
                      Review Extracted Receipts
                    </h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#6A5E55', maxWidth: '580px', lineHeight: 1.5 }}>
                      Click any receipt to inspect and edit details. Delete unwanted items, select receipts with checkboxes, and click <strong>Submit for Review</strong> to send them to Approvals.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={styles.btnSecondarySm}
                      style={{ padding: '10px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      onClick={() => setActiveScreen('scan')}
                    >
                      <Camera size={15} /> Add More
                    </button>
                    <button
                      type="button"
                      className={styles.btnApproveReport}
                      style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: selectedBatchIds.length === 0 || isSubmittingBatch ? 'not-allowed' : 'pointer',
                        opacity: selectedBatchIds.length === 0 || isSubmittingBatch ? 0.6 : 1,
                      }}
                      onClick={handleSubmitBatchForApproval}
                      disabled={selectedBatchIds.length === 0 || isSubmittingBatch}
                    >
                      {isSubmittingBatch ? <Loader2 size={16} className={styles.spinningIcon} /> : <CheckCircle2 size={16} />}
                      Submit for Review ({selectedBatchIds.length})
                    </button>
                  </div>

                  {/* Batch Selection & Action Toolbar */}
                  <div className={styles.batchReviewToolbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#1F1916', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={parsedBatchReceipts.length > 0 && selectedBatchIds.length === parsedBatchReceipts.length}
                          onChange={handleToggleSelectAllBatch}
                          style={{ width: '16px', height: '16px', accentColor: '#7A222B', cursor: 'pointer' }}
                        />
                        <span>Select All ({selectedBatchIds.length}/{parsedBatchReceipts.length} selected)</span>
                      </label>
                    </div>
                    {selectedBatchIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelectedBatch}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} /> Delete Selected ({selectedBatchIds.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid of Parsed Receipts */}
                {parsedBatchReceipts.length === 0 ? (
                  <div style={{ background: '#FFF', border: '1px solid #EFE8DE', borderRadius: '16px', padding: '48px 24px', textAlign: 'center' }}>
                    <Receipt size={40} color="#A89F91" style={{ margin: '0 auto 12px auto' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1F1916' }}>No draft receipts remaining</h3>
                    <p style={{ fontSize: '13px', color: '#8C8075', margin: '6px 0 18px 0' }}>All receipts have been submitted for review or removed.</p>
                    <button
                      type="button"
                      className={styles.btnScanGold}
                      style={{ display: 'inline-flex', width: 'auto', padding: '10px 20px', margin: '0 auto' }}
                      onClick={() => setActiveScreen('scan')}
                    >
                      <Camera size={16} /> Scan More Receipts
                    </button>
                  </div>
                ) : (
                  <div className={styles.batchResultsGrid}>
                    {parsedBatchReceipts.map((r, idx) => {
                      const isSelected = selectedBatchIds.includes(r.id);
                      return (
                        <div
                          key={r.id || idx}
                          className={`${styles.batchReceiptCard} ${isSelected ? styles.batchReceiptCardSelected : ''}`}
                          onClick={() => handleOpenEditReceipt(r)}
                          title="Click to inspect photo & edit receipt details"
                        >
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelectOneBatch(r.id);
                            }}
                            className={styles.batchReceiptCardCheckbox}
                            title="Select / deselect for review"
                          />

                          {/* Top-Right Delete Action */}
                          <div
                            className={styles.batchReceiptTopActions}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className={styles.batchReceiptDeleteBtn}
                              onClick={() => handleDeleteDraftReceipt(r.id)}
                              title="Delete this draft receipt"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className={styles.batchReceiptThumb}>
                            {r.imageUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={r.imageUrl}
                                alt={r.payee}
                                className={styles.batchReceiptImg}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.src.includes('/uploads/') && !target.src.includes('/api/uploads/')) {
                                    target.src = target.src.replace('/uploads/', '/api/uploads/');
                                  }
                                }}
                              />
                            ) : (
                              <Receipt size={28} color="#A89F91" />
                            )}
                          </div>
                          <div className={styles.batchReceiptInfo}>
                            <div>
                              <div className={styles.batchReceiptVendor}>{r.payee || 'Unknown Payee'}</div>
                              <div className={styles.batchReceiptMeta}>
                                {r.date} · {r.expenseCode || 'General'}
                              </div>
                            </div>

                            <div>
                              <div className={styles.batchReceiptAmount}>
                                <div>{r.currency === 'USD' ? `$${Number(r.total).toFixed(2)}` : `${Number(r.total).toLocaleString()} ៛`}</div>
                                <div className={styles.batchReceiptSecondaryAmount}>
                                  ≈ {r.currency === 'USD'
                                    ? `${Math.round(r.total * exchangeRate).toLocaleString()} ៛`
                                    : `$${(r.total / exchangeRate).toFixed(2)}`}
                                </div>
                              </div>
                              <div className={styles.batchReceiptEditPrompt}>
                                <span>Inspect &amp; Edit</span>
                                <ChevronRight size={12} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SCREEN 4: APPROVALS & DUPLICATES */}
            {activeScreen === 'approvals' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#8C8075', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      {currentMonthYear}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1F1916', margin: 0 }}>
                        {t.approvals}
                      </h2>
                      {currentUser?.role === 'OWNER' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                          <ShieldCheck size={13} /> OWNER APPROVAL AUTHORITY
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                          Staff View
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8C8075', marginTop: '4px' }}>
                      Review expenses &amp; client incomes before they land in official financial statements &amp; analytics
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={styles.btnScanMore}
                      onClick={() => setIsIncomeModalOpen(true)}
                      style={{
                        padding: '10px 18px',
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ECFDF5',
                        borderColor: '#A7F3D0',
                        color: '#065F46',
                        fontWeight: 700,
                      }}
                    >
                      <Plus size={16} /> Record Income / Bill
                    </button>
                    {currentUser?.role === 'OWNER' && (
                      <button
                        type="button"
                        className={styles.btnApproveReport}
                        style={{
                          padding: '10px 20px',
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: approvalQueue.length === 0 || isBatchApproving ? 'not-allowed' : 'pointer',
                          opacity: approvalQueue.length === 0 || isBatchApproving ? 0.6 : 1,
                        }}
                        onClick={handleApproveAllQueue}
                        disabled={approvalQueue.length === 0 || isBatchApproving}
                      >
                        {isBatchApproving ? <Loader2 size={16} className={styles.spinningIcon} /> : <CheckCheck size={16} />}
                        Approve All Submissions ({approvalQueue.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-tabs for Approval Queue: All / Expenses / Incomes */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: approvalTab === 'ALL' ? '#7A222B' : '#EFE8DE',
                      background: approvalTab === 'ALL' ? '#7A222B' : '#FFFFFF',
                      color: approvalTab === 'ALL' ? '#FFFFFF' : '#6A5E55',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onClick={() => setApprovalTab('ALL')}
                  >
                    All Pending ({approvalQueue.length})
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: approvalTab === 'EXPENSE' ? '#7A222B' : '#EFE8DE',
                      background: approvalTab === 'EXPENSE' ? '#7A222B' : '#FFFFFF',
                      color: approvalTab === 'EXPENSE' ? '#FFFFFF' : '#6A5E55',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onClick={() => setApprovalTab('EXPENSE')}
                  >
                    Expenses / Receipts ({pendingReceipts.length})
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: approvalTab === 'INCOME' ? '#15803D' : '#EFE8DE',
                      background: approvalTab === 'INCOME' ? '#15803D' : '#FFFFFF',
                      color: approvalTab === 'INCOME' ? '#FFFFFF' : '#6A5E55',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onClick={() => setApprovalTab('INCOME')}
                  >
                    Client Incomes ({pendingIncomes.length})
                  </button>
                </div>

                <div className={styles.approvalsShell}>
                  <div className={styles.approvalsListCard}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className={styles.statusBadge} style={{ background: '#7A222B', color: '#FFF' }}>
                          Needs review · {approvalQueue.filter(i => approvalTab === 'ALL' || i.itemType === approvalTab).length}
                        </span>
                        <span className={styles.statusBadge} style={{ background: '#DCFCE7', color: '#15803D' }}>
                          Approved · {approvedUnifiedTransactions.length}
                        </span>
                      </div>

                      {/* Select All Checkbox for Claims */}
                      {approvalQueue.length > 0 && currentUser?.role === 'OWNER' && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#1F1916', cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            checked={selectedApprovalIds.length === approvalQueue.length}
                            onChange={handleToggleSelectAllApprovals}
                            style={{ width: '15px', height: '15px', accentColor: '#7A222B', cursor: 'pointer' }}
                          />
                          <span>Select All ({selectedApprovalIds.length}/{approvalQueue.length})</span>
                        </label>
                      )}
                    </div>

                    {/* Batch Actions Toolbar when items are selected */}
                    {selectedApprovalIds.length > 0 && currentUser?.role === 'OWNER' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#9A3412' }}>{selectedApprovalIds.length} selected:</span>
                        <button
                          type="button"
                          onClick={handleApproveSelectedQueue}
                          disabled={isBatchApproving}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: '#15803D', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Check size={13} /> Approve Selected ({selectedApprovalIds.length})
                        </button>
                        <button
                          type="button"
                          onClick={handleRejectSelectedQueue}
                          disabled={isBatchApproving}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <X size={13} /> Reject Selected ({selectedApprovalIds.length})
                        </button>
                      </div>
                    )}

                    {approvalQueue.filter(i => approvalTab === 'ALL' || i.itemType === approvalTab).length === 0 ? (
                      <div style={{ padding: '36px 16px', textAlign: 'center', color: '#137333', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <CheckCircle2 size={24} color="#15803D" />
                        <div style={{ fontSize: '15px', color: '#1F1916' }}>
                          {approvalTab === 'INCOME' ? 'No pending client incomes' : 'All approvals completed!'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8C8075', fontWeight: 500, maxWidth: '360px' }}>
                          {approvalTab === 'INCOME'
                            ? 'All recorded revenues and client invoices have been approved. Click "+ Record Income / Bill" above to add a new client payment.'
                            : 'No pending submissions matching this filter. New Telegram receipts or client invoices will appear here.'}
                        </div>
                        {approvalTab === 'INCOME' && (
                          <button
                            type="button"
                            className={styles.btnApproveReport}
                            onClick={() => setIsIncomeModalOpen(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}
                          >
                            <Plus size={15} /> Record Income / Bill
                          </button>
                        )}
                      </div>
                    ) : (
                      approvalQueue
                        .filter(i => approvalTab === 'ALL' || i.itemType === approvalTab)
                        .map((item) => {
                          const isChecked = selectedApprovalIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              style={{
                                padding: '12px',
                                border: selectedAuditItem?.id === item.id ? '2px solid #7A222B' : '1px solid #EFE8DE',
                                borderRadius: '12px',
                                background: isChecked ? '#FFFDF8' : '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.15s ease',
                                marginBottom: '8px',
                              }}
                              onClick={() => setSelectedAuditItem(item)}
                            >
                              {currentUser?.role === 'OWNER' && (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelectApproval(item.id);
                                  }}
                                  style={{ width: '16px', height: '16px', accentColor: '#7A222B', cursor: 'pointer' }}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        background: item.itemType === 'INCOME' ? '#DCFCE7' : '#FEE2E2',
                                        color: item.itemType === 'INCOME' ? '#15803D' : '#991B1B',
                                      }}
                                    >
                                      {item.itemType === 'INCOME' ? 'INFLOW' : 'CLAIM'}
                                    </span>
                                    <span style={{ fontWeight: 800, color: '#1F1916' }}>{item.vendor}</span>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, color: item.itemType === 'INCOME' ? '#15803D' : '#1F1916' }}>
                                      {item.itemType === 'INCOME' ? '+' : '-'}
                                      {item.currency === 'USD' ? `$${item.total}` : `${item.total.toLocaleString()} ៛`}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#8C8075', fontWeight: 600 }}>
                                      ≈ {item.currency === 'USD' ? `${Math.round(item.total * exchangeRate).toLocaleString()} ៛` : `$${(item.total / exchangeRate).toFixed(2)}`}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#8C8075', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <User size={12} />
                                  <span>{item.submittedBy || item.claimant} · {item.date} · {item.category}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#D97706', fontWeight: 700, marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <AlertTriangle size={12} /> {item.flag} · {item.note}
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  <div className={styles.duplicateAuditCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400E', fontWeight: 700, fontSize: '14px' }}>
                      <AlertTriangle size={16} /> {selectedAuditItem ? (selectedAuditItem.itemType === 'INCOME' ? 'PENDING REVENUE AUDIT' : selectedAuditItem.flag) : 'Select a submission from the queue'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7D7168' }}>
                      {selectedAuditItem ? selectedAuditItem.note : 'Click any submission on the left to inspect audit details, claimant or payer, and verify financial compliance.'}
                    </div>

                    {selectedAuditItem && (
                      <>
                        <div style={{ background: '#FFF', border: '1px solid #EFE8DE', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {selectedAuditItem.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={selectedAuditItem.imageUrl}
                              alt={selectedAuditItem.vendor}
                              style={{ width: '80px', height: '80px', objectFit: 'contain', background: '#FAF7F2', borderRadius: '8px', border: '1px solid #EFE8DE' }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src.includes('/uploads/') && !target.src.includes('/api/uploads/')) {
                                  target.src = target.src.replace('/uploads/', '/api/uploads/');
                                }
                              }}
                            />
                          ) : (
                            <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: selectedAuditItem.itemType === 'INCOME' ? '#DCFCE7' : '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {selectedAuditItem.itemType === 'INCOME' ? <DollarSign size={32} color="#15803D" /> : <Receipt size={32} color="#7A222B" />}
                            </div>
                          )}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  background: selectedAuditItem.itemType === 'INCOME' ? '#DCFCE7' : '#FEE2E2',
                                  color: selectedAuditItem.itemType === 'INCOME' ? '#15803D' : '#991B1B',
                                }}
                              >
                                {selectedAuditItem.itemType === 'INCOME' ? 'CLIENT INFLOW' : 'EXPENSE CLAIM'}
                              </span>
                              <span style={{ fontSize: '15px', fontWeight: 800, color: '#1F1916' }}>{selectedAuditItem.vendor}</span>
                            </div>
                            <div>
                              <strong>Submitted By:</strong>{' '}
                              <span style={{ color: '#7A222B', fontWeight: 700 }}>
                                {selectedAuditItem.submittedBy || selectedAuditItem.claimant}
                              </span>
                            </div>
                            <div><strong>Date:</strong> {selectedAuditItem.date} · <strong>Category:</strong> {selectedAuditItem.category}</div>
                            {selectedAuditItem.itemType === 'INCOME' && selectedAuditItem.rawIncome?.invoiceNo && (
                              <div><strong>Invoice #:</strong> {selectedAuditItem.rawIncome.invoiceNo}</div>
                            )}
                            <div style={{ fontSize: '14px', fontWeight: 800, color: selectedAuditItem.itemType === 'INCOME' ? '#15803D' : '#7A222B', marginTop: '2px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                              <span>Total: {selectedAuditItem.itemType === 'INCOME' ? '+' : '-'}{selectedAuditItem.currency === 'USD' ? `$${selectedAuditItem.total} USD` : `${selectedAuditItem.total.toLocaleString()} ៛ KHR`}</span>
                              <span style={{ fontSize: '12px', color: '#6A5E55', fontWeight: 600 }}>
                                (≈ {selectedAuditItem.currency === 'USD' ? `${Math.round(selectedAuditItem.total * exchangeRate).toLocaleString()} ៛ KHR` : `$${(selectedAuditItem.total / exchangeRate).toFixed(2)} USD`} @ {exchangeRate.toLocaleString()} rate)
                              </span>
                            </div>
                          </div>
                        </div>

                        {currentUser?.role === 'OWNER' ? (
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className={styles.btnRetake}
                              style={{ flex: 1, minWidth: '100px' }}
                              onClick={() => handleQueueDecision(selectedAuditItem.id, 'reject')}
                            >
                              Reject {selectedAuditItem.itemType === 'INCOME' ? 'Income' : 'Claim'}
                            </button>
                            <button
                              type="button"
                              style={{
                                flex: 1,
                                minWidth: '120px',
                                background: '#FFFFFF',
                                border: '1px solid #D6CBC1',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#4A3E36',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                if (selectedAuditItem.itemType === 'INCOME') {
                                  const fullIncome = incomes.find((i) => i.id === selectedAuditItem.id) || selectedAuditItem.rawIncome;
                                  if (fullIncome) handleOpenEditIncome(fullIncome);
                                } else {
                                  const fullReceipt = receipts.find((r) => r.id === selectedAuditItem.id) || selectedAuditItem.rawReceipt;
                                  if (fullReceipt) handleOpenEditReceipt(fullReceipt);
                                }
                              }}
                            >
                              <Edit3 size={14} /> Edit &amp; Review
                            </button>
                            <button
                              type="button"
                              className={styles.btnApproveReport}
                              style={{ flex: 1, minWidth: '120px' }}
                              onClick={() => handleQueueDecision(selectedAuditItem.id, 'approve')}
                            >
                              Approve {selectedAuditItem.itemType === 'INCOME' ? 'Income' : 'Claim'}
                            </button>
                          </div>
                        ) : (
                          <div style={{ padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '12px', color: '#475569', textAlign: 'center', fontWeight: 600 }}>
                            <Shield size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Awaiting Owner approval. Only Workspace Owners can approve submissions into Reports.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 5: COMBINED FINANCIAL CASHFLOW & TRANSACTIONS REPORT */}
            {activeScreen === 'reports' && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#8C8075', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  FINANCIAL CASHFLOW &amp; TRANSACTIONS REPORT
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1F1916', margin: 0 }}>
                      Company Financial Statements
                    </h2>
                    <div style={{ fontSize: '13px', color: '#8C8075', marginTop: '4px' }}>
                      Combined ledger of all verified company incomes &amp; expenses · Only approved items are reflected in official statements
                    </div>
                  </div>
                  <button className={styles.btnScanGold} style={{ width: 'auto', margin: 0, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleExportExcel}>
                    <Download size={15} /> Export Combined Excel (.xlsx)
                  </button>
                </div>

                {/* KPI Summary Cards at the top of the combined report */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', letterSpacing: '0.05em' }}>TOTAL INFLOW (APPROVED)</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803D', marginTop: '4px' }}>
                      {isBaseUsd ? `$${totalIncomeUsd.toFixed(2)}` : `${Math.round(totalIncomeKhr).toLocaleString()} ៛`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8C8075', marginTop: '2px' }}>
                      {approvedIncomes.length} client payments recorded
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#7A222B', letterSpacing: '0.05em' }}>TOTAL OUTFLOW (APPROVED)</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#7A222B', marginTop: '4px' }}>
                      {isBaseUsd ? `$${totalSpendUsd.toFixed(2)}` : `${Math.round(totalSpendKhr).toLocaleString()} ៛`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8C8075', marginTop: '2px' }}>
                      {approvedCount} expense claims verified
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: netCashflowUsd >= 0 ? '#15803D' : '#DC2626', letterSpacing: '0.05em' }}>NET CASHFLOW BALANCE</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: netCashflowUsd >= 0 ? '#15803D' : '#DC2626', marginTop: '4px' }}>
                      {netCashflowUsd >= 0 ? '+' : ''}{isBaseUsd ? `$${netCashflowUsd.toFixed(2)}` : `${Math.round(netCashflowKhr).toLocaleString()} ៛`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8C8075', marginTop: '2px' }}>
                      {netCashflowUsd >= 0 ? 'Positive company cash balance' : 'Net expenditure exceeds revenue'}
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.05em' }}>APPROVED RECORDS</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#1F1916', marginTop: '4px' }}>
                      {approvedUnifiedTransactions.length}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8C8075', marginTop: '2px' }}>
                      {approvalQueue.length > 0 ? `${approvalQueue.length} pending in Approvals tab` : '100% approvals up to date'}
                    </div>
                  </div>
                </div>

                {/* Filter Controls */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search payee, client, invoice #..."
                    className={styles.warmInput}
                    style={{ width: '240px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select className={styles.warmInput} value={reportTypeFilter} onChange={(e) => setReportTypeFilter(e.target.value as any)}>
                    <option value="ALL">All Types (Inflow &amp; Outflow)</option>
                    <option value="INCOME">Client Incomes Only</option>
                    <option value="EXPENSE">Expenses Only</option>
                  </select>
                  <select className={styles.warmInput} value={reportStatusFilter} onChange={(e) => setReportStatusFilter(e.target.value)}>
                    <option value="APPROVED">Approved Only (Official Reports)</option>
                    <option value="ALL">All Statuses (Approved, Pending, Rejected)</option>
                    <option value="PENDING">Pending Approval</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <select className={styles.warmInput} value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                    <option value="ALL">All Departments</option>
                    {workspaceSettings.departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <select className={styles.warmInput} value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value as any)}>
                    <option value="ALL">All Currencies</option>
                    <option value="KHR">KHR Only</option>
                    <option value="USD">USD Only</option>
                  </select>
                </div>

                <div className={styles.reportsLayout}>
                  <div className={styles.excelPreviewCard}>
                    {/* Header bar of Excel Preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileSpreadsheet size={20} color="#15803D" />
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#1F1916' }}>
                          {currentUser?.workspaceName ? currentUser.workspaceName.replace(/\s+/g, '_') : 'Company'}_Financial_Ledger_2026.xlsx
                        </div>
                        <div style={{ fontSize: '12px', color: '#8C8075', marginTop: '2px' }}>
                          {filteredCombinedTransactions.length} transactions displayed · Master Currency: <strong>{workspaceSettings.baseCurrency}</strong> (1 $ = {workspaceSettings.exchangeRate.toLocaleString()} ៛)
                        </div>
                      </div>
                    </div>

                    <table className={styles.receiptsTable}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th style={{ textAlign: 'center' }}>Type</th>
                          <th>Ref / Doc #</th>
                          <th>Counterparty</th>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Submitter</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th style={{ textAlign: 'right' }}>{isBaseUsd ? 'USD Equiv' : 'KHR Equiv'}</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCombinedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={10} style={{ padding: '48px 16px', textAlign: 'center', color: '#8C8075' }}>
                              <Receipt size={36} color="#A89F91" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1F1916' }}>No transactions found matching your filters</div>
                              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                Scan receipts or record income, or check the Approvals tab if items are pending review.
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredCombinedTransactions.map((tx) => {
                            const isIncome = tx.itemType === 'INCOME';
                            return (
                              <tr
                                key={tx.id}
                                onClick={() => {
                                  if (isIncome) {
                                    handleOpenEditIncome(tx.rawItem);
                                  } else {
                                    handleOpenEditReceipt(tx.rawItem);
                                  }
                                }}
                                title="Click to inspect photo and edit details"
                                style={{ cursor: 'pointer' }}
                              >
                                <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{tx.date}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: isIncome ? '#DCFCE7' : '#FEE2E2',
                                      color: isIncome ? '#15803D' : '#991B1B',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    {isIncome ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                                    {isIncome ? 'INCOME' : 'EXPENSE'}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 700, color: '#6A5E55' }}>{tx.refNo}</td>
                                <td style={{ fontWeight: 700, color: '#1F1916' }}>{tx.party}</td>
                                <td>
                                  <span style={{ background: isIncome ? '#F0FDF4' : '#F5EFE6', color: isIncome ? '#15803D' : '#7A222B', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                                    {tx.category || 'General'}
                                  </span>
                                </td>
                                <td style={{ color: '#5A514B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {tx.description}
                                </td>
                                <td style={{ fontSize: '12px', color: '#6A5E55' }}>
                                  {tx.submitter}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', color: isIncome ? '#15803D' : '#7A222B' }}>
                                  {isIncome ? '+' : '-'}
                                  {tx.currency === 'USD' ? `$${Number(tx.total).toFixed(2)}` : `${Number(tx.total).toLocaleString()} ៛`}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', color: tx.baseEquiv >= 0 ? '#15803D' : '#1F1916' }}>
                                  {isBaseUsd
                                    ? `${tx.baseEquiv >= 0 ? '+' : ''}$${tx.baseEquiv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `${tx.baseEquiv >= 0 ? '+' : ''}${Math.round(tx.baseEquiv).toLocaleString()} ៛`}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span
                                    className={`${styles.statusBadge} ${
                                      tx.status === 'APPROVED' ? styles.statusApproved : tx.status === 'REIMBURSED' ? styles.statusProcessing : styles.statusNeedsCheck
                                    }`}
                                  >
                                    {tx.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 6: ARCHIVE GALLERY */}
            {activeScreen === 'archive' && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#8C8075', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  {receipts.length} ORIGINAL RECEIPTS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1F1916' }}>
                    {t.archive}
                  </h2>
                  <div style={{ background: '#7A222B', color: '#FFF', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={13} /> Original images stored securely on your server
                  </div>
                </div>

                <div className={styles.archiveGrid}>
                  {receipts.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 16px', color: '#8C8075', background: '#FFFDF8', borderRadius: '16px', border: '1px solid #EFE8DE' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><ArchiveIcon size={36} color="#8C8075" /></div>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: '#1F1916' }}>Archive is empty</div>
                      <div style={{ fontSize: '13px', marginTop: '6px' }}>Receipt photos and PDF attachments uploaded to this workspace will appear here.</div>
                    </div>
                  ) : (
                    receipts.map((r) => (
                      <div
                        key={r.id}
                        className={styles.archiveCard}
                        onClick={() => handleOpenEditReceipt(r)}
                        title="Click to inspect photo and edit details"
                      >
                        <div className={styles.archivePaperGraphic}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.imageUrl}
                            alt={r.payee}
                            style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src.includes('/uploads/') && !target.src.includes('/api/uploads/')) {
                                target.src = target.src.replace('/uploads/', '/api/uploads/');
                              }
                            }}
                          />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{r.payee}</div>
                        <div style={{ fontSize: '12px', color: '#8C8075' }}>
                          {r.date} · {r.currency === 'USD' ? `$${r.total}` : `${r.total.toLocaleString()} ៛`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 7: WORKSPACE & POLICIES SETTINGS */}
            {activeScreen === 'settings' && (
              <div className={styles.settingsContainer}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#8C8075', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      WORKSPACE & POLICIES
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1F1916' }}>
                      {t.settings}
                    </h2>
                  </div>
                  {settingsNotice && (
                    <div style={{ background: '#E6F4EA', color: '#137333', padding: '8px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} /> {settingsNotice}
                    </div>
                  )}
                </div>

                {/* Card 1: Company Profile & Workspace Setup */}
                <div className={styles.settingsCard}>
                  <div className={styles.settingsCardHeader}>
                    <div>
                      <div className={styles.settingsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={18} /> Company &amp; Workspace Profile
                      </div>
                      <div className={styles.settingsCardDesc}>
                        Manage your company name and workspace preferences.
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingsFormGrid}>
                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Company / Organization Name</label>
                      <input
                        className={styles.warmInput}
                        value={workspaceSettings.name}
                        onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, name: e.target.value })}
                      />
                    </div>

                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Primary Reporting Currency</label>
                      <div className={styles.segmentedToggle} style={{ width: '100%', height: '42px' }}>
                        <button
                          type="button"
                          className={`${styles.segmentBtn} ${workspaceSettings.baseCurrency === 'KHR' ? styles.segmentBtnActive : ''}`}
                          onClick={() => handleToggleBaseCurrency('KHR')}
                        >
                          <span className={styles.currBadgeIcon}>៛</span>
                          <span>KHR (៛ Riel)</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.segmentBtn} ${workspaceSettings.baseCurrency === 'USD' ? styles.segmentBtnActive : ''}`}
                          onClick={() => handleToggleBaseCurrency('USD')}
                        >
                          <span className={styles.currBadgeIcon}>$</span>
                          <span>USD ($ Dollar)</span>
                        </button>
                      </div>
                    </div>

                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Exchange Rate (៛ KHR per $1 USD)</label>
                      <input
                        type="number"
                        className={styles.warmInput}
                        value={workspaceSettings.exchangeRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setWorkspaceSettings({ ...workspaceSettings, exchangeRate: val });
                          setHeaderRateInput(e.target.value);
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#8C8075' }}>
                        Rate used to convert amounts between Riel and USD (also editable directly in the top header).
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Expense Categories & Dynamic AI Vision Prompt */}
                <div className={styles.settingsCard}>
                  <div className={styles.settingsCardHeader}>
                    <div>
                      <div className={styles.settingsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={18} /> Expense Categories &amp; AI Vision Classification
                      </div>
                      <div className={styles.settingsCardDesc}>
                        Define company expense categories. Our Gemini AI Vision prompt dynamically injects these categories to classify your receipts accurately during scanning.
                      </div>
                    </div>
                    {currentUser?.role !== 'OWNER' && (
                      <span style={{ fontSize: '12px', background: '#F1E9DC', color: '#6A5E55', padding: '4px 10px', borderRadius: '8px', fontWeight: 600 }}>
                        Owner Managed
                      </span>
                    )}
                  </div>

                  <div className={styles.categoryChipsContainer}>
                    {workspaceSettings.expenseCodes.map((cat, idx) => {
                      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                      return (
                        <div key={cat} className={styles.categoryChip}>
                          <span className={styles.categoryChipDot} style={{ background: color }} />
                          <span>{cat}</span>
                          {currentUser?.role === 'OWNER' && workspaceSettings.expenseCodes.length > 1 && (
                            <button
                              type="button"
                              className={styles.categoryChipRemoveBtn}
                              title={`Remove ${cat}`}
                              onClick={() => handleRemoveCategory(cat)}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {currentUser?.role === 'OWNER' ? (
                    <div className={styles.addCategoryRow}>
                      <input
                        type="text"
                        className={styles.warmInput}
                        placeholder="Add new category (e.g. Software, Equipment, Travel)..."
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className={styles.btnAddItemWarm}
                        onClick={handleAddCategory}
                      >
                        <Plus size={14} /> Add Category
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#8C8075', fontStyle: 'italic' }}>
                      Only the workspace owner can add or remove expense categories.
                    </div>
                  )}
                </div>

                {/* Card 3: Company Departments & Cost Routing */}
                <div className={styles.settingsCard}>
                  <div className={styles.settingsCardHeader}>
                    <div>
                      <div className={styles.settingsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FolderTree size={18} /> Company Departments &amp; Cost Routing
                      </div>
                      <div className={styles.settingsCardDesc}>
                        Define business departments and teams. Gemini AI Vision will intelligently route scanned receipts to the most relevant department.
                      </div>
                    </div>
                    {currentUser?.role !== 'OWNER' && (
                      <span style={{ fontSize: '12px', background: '#F1E9DC', color: '#6A5E55', padding: '4px 10px', borderRadius: '8px', fontWeight: 600 }}>
                        Owner Managed
                      </span>
                    )}
                  </div>

                  <div className={styles.categoryChipsContainer}>
                    {workspaceSettings.departments.map((dept) => (
                      <div key={dept} className={styles.categoryChip}>
                        <Building2 size={12} color="#7A222B" />
                        <span>{dept}</span>
                        {currentUser?.role === 'OWNER' && workspaceSettings.departments.length > 1 && (
                          <button
                            type="button"
                            className={styles.categoryChipRemoveBtn}
                            title={`Remove ${dept}`}
                            onClick={() => handleRemoveDepartment(dept)}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {currentUser?.role === 'OWNER' ? (
                    <div className={styles.addCategoryRow}>
                      <input
                        type="text"
                        className={styles.warmInput}
                        placeholder="Add new department (e.g. Marketing, Legal, Logistics)..."
                        value={newDeptInput}
                        onChange={(e) => setNewDeptInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDepartment();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className={styles.btnAddItemWarm}
                        onClick={handleAddDepartment}
                      >
                        <Plus size={14} /> Add Department
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#8C8075', fontStyle: 'italic' }}>
                      Only the workspace owner can add or remove company departments.
                    </div>
                  )}
                </div>

                {/* Card 4: Spreadsheet Column Template Customizer */}
                <div className={styles.settingsCard}>
                  <div className={styles.settingsCardHeader}>
                    <div>
                      <div className={styles.settingsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileSpreadsheet size={18} /> Spreadsheet Template Column Builder
                      </div>
                      <div className={styles.settingsCardDesc}>
                        Toggle which columns are exported into the generated Cambodian business Excel (.xlsx) file.
                      </div>
                    </div>
                  </div>

                  <div className={styles.columnsGrid}>
                    {workspaceSettings.columns.map((col, idx) => (
                      <div key={col.id || idx} className={styles.columnToggleItem}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#8C8075', width: '16px' }}>{idx + 1}</span>
                          <span style={{ color: '#1F1916' }}>{col.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={col.isVisible}
                          onChange={(e) => {
                            const newCols = [...workspaceSettings.columns];
                            newCols[idx] = { ...col, isVisible: e.target.checked };
                            setWorkspaceSettings({ ...workspaceSettings, columns: newCols });
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#7A222B', cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 5: Telegram Bot Assistant Integration */}
                <div className={styles.settingsCard}>
                  <div className={styles.settingsCardHeader}>
                    <div>
                      <div className={styles.settingsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bot size={18} color="#0088cc" /> Telegram Bot &amp; Chatbot
                      </div>
                      <div className={styles.settingsCardDesc}>
                        Connect your workspace to a dedicated Telegram bot. The bot can answer questions about your spendings, predict future runway, and send real-time alerts.
                      </div>
                    </div>
                    <div>
                      {workspaceSettings.telegramBotToken && workspaceSettings.telegramChatId ? (
                        <span className={`${styles.telegramStatusPill} ${styles.telegramStatusConnected}`}>
                          <CheckCircle2 size={12} /> Connected (@{workspaceSettings.telegramBotUsername || 'bot'})
                        </span>
                      ) : (
                        <span className={`${styles.telegramStatusPill} ${styles.telegramStatusDisconnected}`}>
                          <AlertCircle size={12} /> Not Configured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.telegramSetupBox}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0088cc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Send size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1F1916' }}>Two-Way Financial Chatbot &amp; Live Alerts</div>
                        <div style={{ fontSize: '12px', color: '#6A5E55' }}>Ask anything like <em>"What is our burn rate?"</em>, <em>"Predict next month runway"</em>, or take photos of receipts directly in Telegram!</div>
                      </div>
                    </div>

                    <div className={styles.settingsFormGrid}>
                      <div className={styles.settingsFormGroup}>
                        <label className={styles.settingsLabel}>Telegram Bot Token (from @BotFather)</label>
                        <input
                          type="password"
                          className={styles.warmInput}
                          placeholder="e.g. 7123456789:AAHxxxxx_xxxxxxxxxxxxxxx"
                          value={workspaceSettings.telegramBotToken || ''}
                          onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, telegramBotToken: e.target.value })}
                        />
                        <span style={{ fontSize: '11px', color: '#8C8075' }}>
                          Create a bot in Telegram by chatting with @BotFather, send /newbot, and paste the API token here.
                        </span>
                      </div>

                      <div className={styles.settingsFormGroup}>
                        <label className={styles.settingsLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={16} color="#7A222B" />
                          <span>Owner Telegram Chat ID(s)</span>
                          <span style={{ fontSize: '11px', color: '#7A222B', fontWeight: 600 }}>(Full Access &amp; Alerts)</span>
                        </label>
                        <input
                          type="text"
                          className={styles.warmInput}
                          placeholder="e.g. 123456789 or 123456789, 987654321"
                          value={workspaceSettings.telegramChatId || ''}
                          onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, telegramChatId: e.target.value })}
                        />
                        <span style={{ fontSize: '11px', color: '#8C8075' }}>
                          Full executive access. Owners receive immediate High-Expense alerts (when receipts exceed the $ threshold) and can ask the chatbot questions about burn rate, runway, and reports.
                        </span>
                      </div>

                      <div className={styles.settingsFormGroup}>
                        <label className={styles.settingsLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={16} color="#0369A1" />
                          <span>Staff / Member Telegram Chat ID(s)</span>
                          <span style={{ fontSize: '11px', color: '#0369A1', fontWeight: 600 }}>(Submissions Only)</span>
                        </label>
                        <input
                          type="text"
                          className={styles.warmInput}
                          placeholder="e.g. 556677889, 112233445 or Staff Group -100123456789"
                          value={workspaceSettings.telegramMemberChatIds || ''}
                          onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, telegramMemberChatIds: e.target.value })}
                        />
                        <span style={{ fontSize: '11px', color: '#8C8075' }}>
                          Restricted access. Staff members can <b>ONLY</b> send receipt/invoice photos and tap the 2 buttons (Expense or Income). They cannot query financial metrics or view company runway.
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '4px' }}>
                      <button
                        type="button"
                        className={styles.btnScanMore}
                        onClick={handleTestTelegram}
                        disabled={isTestingTelegram || !workspaceSettings.telegramBotToken}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        {isTestingTelegram ? <Loader2 size={14} className={styles.spinner} /> : <Zap size={14} />}
                        {isTestingTelegram ? 'Testing Connection...' : 'Test Connection & Ping Both IDs'}
                      </button>
                    </div>

                    {telegramTestResult && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: telegramTestResult.success ? '#DEF7EC' : '#FDE8E8',
                        color: telegramTestResult.success ? '#03543F' : '#9B1C1C',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        {telegramTestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        <span>{telegramTestResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 6: Automated Notification Rules & Thresholds */}
                <div className={styles.settingsCard}>
                  <div className={styles.settingsCardHeader}>
                    <div>
                      <div className={styles.settingsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={18} /> Automated Notification Rules &amp; Thresholds
                      </div>
                      <div className={styles.settingsCardDesc}>
                        Configure which events automatically push immediate Telegram notifications to the workspace owner.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className={styles.notifyToggleRow}>
                      <div className={styles.notifyToggleText}>
                        <div className={styles.notifyToggleTitle}>High-Value Receipt Claim Alert (Immediate on Add)</div>
                        <div className={styles.notifyToggleDesc}>
                          Sends an immediate Telegram alert to the Owner as soon as any receipt is added (via web or Telegram) meeting or exceeding this USD threshold.
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>Min: $</span>
                          <input
                            type="number"
                            className={styles.warmInput}
                            style={{ width: '80px', padding: '6px 10px', height: '32px' }}
                            value={workspaceSettings.notifyHighSpendMin ?? 100}
                            onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, notifyHighSpendMin: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <input
                          type="checkbox"
                          checked={workspaceSettings.notifyHighSpend ?? true}
                          onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, notifyHighSpend: e.target.checked })}
                          style={{ width: '18px', height: '18px', accentColor: '#7A222B', cursor: 'pointer' }}
                        />
                      </div>
                    </div>


                    <div className={styles.notifyToggleRow}>
                      <div className={styles.notifyToggleText}>
                        <div className={styles.notifyToggleTitle}>Fraud &amp; Duplicate Receipt Sentinel</div>
                        <div className={styles.notifyToggleDesc}>
                          Instant warning when duplicate receipts or mismatched tax TINs are detected by AI.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={workspaceSettings.notifyAnomalies ?? true}
                        onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, notifyAnomalies: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#7A222B', cursor: 'pointer' }}
                      />
                    </div>

                    <div className={styles.notifyToggleRow}>
                      <div className={styles.notifyToggleText}>
                        <div className={styles.notifyToggleTitle}>Daily Morning Digest</div>
                        <div className={styles.notifyToggleDesc}>
                          Brief morning summary with yesterday spend, total cash balance, and runway status.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={workspaceSettings.notifyDailyDigest ?? true}
                        onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, notifyDailyDigest: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#7A222B', cursor: 'pointer' }}
                      />
                    </div>

                    <div className={styles.notifyToggleRow}>
                      <div className={styles.notifyToggleText}>
                        <div className={styles.notifyToggleTitle}>Monthly Budget Runway Warning</div>
                        <div className={styles.notifyToggleDesc}>
                          Alert when monthly spendings cross 80% and 100% of the allocated budget.
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>Budget: $</span>
                          <input
                            type="number"
                            className={styles.warmInput}
                            style={{ width: '90px', padding: '6px 10px', height: '32px' }}
                            value={workspaceSettings.monthlyBudgetUsd ?? 5000}
                            onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, monthlyBudgetUsd: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <input
                          type="checkbox"
                          checked={workspaceSettings.notifyBudgetAlert ?? true}
                          onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, notifyBudgetAlert: e.target.checked })}
                          style={{ width: '18px', height: '18px', accentColor: '#7A222B', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '32px' }}>
                  <button
                    className={styles.btnApproveReport}
                    style={{ width: 'auto', padding: '12px 28px' }}
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                  >
                    {isSavingSettings ? 'Saving...' : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Save size={14} /> Save Workspace Settings
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 8: TEAM & WORKSPACE MEMBERS */}
            {activeScreen === 'team' && (
              <div className={styles.teamContainer}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1F1916', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={24} /> Team &amp; Workspace Members
                      </h2>
                      <p style={{ fontSize: '13px', color: '#8C8075', margin: '4px 0 0 0' }}>
                        Manage company members and share your workspace invite code or direct link to collaborate.
                      </p>
                    </div>

                    <button
                      type="button"
                      className={styles.btnOutlineWarm}
                      onClick={fetchMembers}
                      disabled={isRefreshingMembers}
                      title="Sync and refresh active team members"
                    >
                      <RefreshCw size={14} className={isRefreshingMembers ? styles.spinning : ''} />
                      <span>{isRefreshingMembers ? 'Syncing...' : 'Refresh Members'}</span>
                    </button>
                  </div>
                </div>

                {/* Invite Code & Shareable Link Banner */}
                <div className={styles.inviteCodeBanner}>
                  <div className={styles.inviteBannerLeft}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#E8BA5A', fontWeight: 700 }}>
                      Company Workspace Invite Access
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>
                      {currentUser?.workspaceName || 'Your Company Workspace'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#E2D9CD', marginTop: '2px' }}>
                      Share this code or direct link with team members to join with their Google account.
                    </div>
                  </div>

                  <div className={styles.inviteBannerCodeGroup}>
                    <div className={styles.inviteCodeBadge}>
                      {currentUser?.inviteCode || workspaceSettings.inviteCode || '—'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        type="button"
                        className={styles.btnCopyWhite}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          const code = currentUser?.inviteCode || workspaceSettings.inviteCode;
                          if (code) {
                            navigator.clipboard.writeText(code);
                            alert(`Invite code "${code}" copied to clipboard!`);
                          } else {
                            alert('Invite code is being generated or synchronized.');
                          }
                        }}
                      >
                        <Copy size={13} /> Copy Code
                      </button>
                      <button
                        type="button"
                        className={styles.btnCopyWhite}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          const code = currentUser?.inviteCode || workspaceSettings.inviteCode;
                          if (code) {
                            const url = `${window.location.origin}/?invite=${code}`;
                            navigator.clipboard.writeText(url);
                            alert(`Invite link copied to clipboard!\n${url}`);
                          } else {
                            alert('Invite link unavailable until workspace is loaded.');
                          }
                        }}
                      >
                        <LinkIcon size={13} /> Copy Direct Link
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Members Card */}
                <div className={styles.settingsCard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles.settingsCardHeader}>
                    <div>
                      <div className={styles.settingsCardTitle}>Active Members ({members.length})</div>
                      <div className={styles.settingsCardDesc}>
                        Colleagues currently collaborating in this workspace.
                      </div>
                    </div>
                  </div>

                  <div className={styles.membersList}>
                    {members.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#8C8075', fontSize: '13px' }}>
                        No members loaded. Click Refresh to synchronize.
                      </div>
                    ) : (
                      members.map((member) => {
                        const initials = member.name
                          ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                          : member.email.slice(0, 2).toUpperCase();
                        const isSelf = member.id === currentUser?.userId;

                        return (
                          <div key={member.id} className={styles.memberRow}>
                            <div className={styles.memberLeft}>
                              <div className={styles.memberAvatar}>{initials}</div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className={styles.memberName}>{member.name || member.email.split('@')[0]}</span>
                                  {isSelf && (
                                    <span style={{ fontSize: '10px', background: '#F5EFE6', color: '#7A222B', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className={styles.memberEmail}>{member.email}</div>
                                {member.department && (
                                  <div style={{ fontSize: '11px', color: '#A3968A', marginTop: '2px' }}>
                                    Dept: {member.department}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className={`${styles.memberRoleBadge} ${member.role === 'OWNER' ? styles.memberRoleOwner : styles.memberRoleMember}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {member.role === 'OWNER' ? <Shield size={11} /> : <User size={11} />}
                                {member.role === 'OWNER' ? 'Owner' : 'Member'}
                              </span>

                              {currentUser?.role === 'OWNER' && !isSelf && (
                                <button
                                  type="button"
                                  className={styles.btnDangerSm}
                                  onClick={() => handleRemoveMember(member.id)}
                                  title="Remove user from workspace"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN: EXECUTIVE ANALYTICS & PREDICTIVE RUNWAY */}
            {activeScreen === 'analytics' && (
              <div className={styles.analyticsContainer}>
                {/* Header */}
                <div className={styles.analyticsHeader}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#8C8075', letterSpacing: '0.08em', marginBottom: '4px' }}>
                      FINANCIAL INTELLIGENCE &amp; RUNWAY PREDICTIONS
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1F1916', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BarChart3 size={26} color="#7A222B" /> Financial Health &amp; Analytics
                    </h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      className={styles.btnScanMore}
                      onClick={fetchAnalytics}
                      disabled={isLoadingAnalytics}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RefreshCw size={14} className={isLoadingAnalytics ? styles.spinner : ''} />
                      {isLoadingAnalytics ? 'Updating...' : 'Refresh Live'}
                    </button>
                  </div>
                </div>

                {/* Top Metrics Row */}
                <div className={styles.analyticsMetricsGrid}>
                  {/* Runway Clock */}
                  <div className={styles.analyticsCard}>
                    <div className={styles.analyticsCardTitle}>
                      <Clock size={16} color="#7A222B" /> Cash Runway Clock
                    </div>
                    <div className={styles.analyticsCardValue} style={{ color: (analyticsData?.metrics?.runwayMonths || 0) < 3 ? '#DC2626' : '#1F1916' }}>
                      {analyticsData?.metrics?.runwayMonths !== undefined ? `${analyticsData.metrics.runwayMonths} mo` : '—'}
                    </div>
                    <div className={styles.analyticsCardSub} style={{ color: '#8C8075' }}>
                      <span>Avg burn: ${Math.round(analyticsData?.metrics?.monthlyBurnUsd || 0).toLocaleString()}/mo</span>
                    </div>
                  </div>

                  {/* Net Cashflow Dual Currency */}
                  <div className={styles.analyticsCard}>
                    <div className={styles.analyticsCardTitle}>
                      <TrendingUp size={16} color="#10B981" /> Net Cashflow
                    </div>
                    <div className={styles.analyticsCardValue} style={{ color: (analyticsData?.metrics?.netCashflowUsd || 0) >= 0 ? '#10B981' : '#EF4444' }}>
                      {(analyticsData?.metrics?.netCashflowUsd || 0) >= 0 ? '+' : ''}${Math.round(analyticsData?.metrics?.netCashflowUsd || 0).toLocaleString()}
                    </div>
                    <div className={styles.analyticsCardSub} style={{ color: '#8C8075' }}>
                      <span>៛{Math.round(analyticsData?.metrics?.netCashflowKhr || 0).toLocaleString()} Riel total</span>
                    </div>
                  </div>

                  {/* Total Income Inflow */}
                  <div className={styles.analyticsCard}>
                    <div className={styles.analyticsCardTitle}>
                      <ArrowDownLeft size={16} color="#10B981" /> Total Inflow
                    </div>
                    <div className={styles.analyticsCardValue}>
                      ${Math.round(analyticsData?.metrics?.totalIncomeUsd || 0).toLocaleString()}
                    </div>
                    <div className={styles.analyticsCardSub} style={{ color: '#10B981' }}>
                      <span>{analyticsData?.metrics?.totalIncomes || 0} recorded invoices</span>
                    </div>
                  </div>

                  {/* Total Expense Outflow */}
                  <div className={styles.analyticsCard}>
                    <div className={styles.analyticsCardTitle}>
                      <ArrowUpRight size={16} color="#EF4444" /> Total Outflow
                    </div>
                    <div className={styles.analyticsCardValue}>
                      ${Math.round(analyticsData?.metrics?.totalExpenseUsd || 0).toLocaleString()}
                    </div>
                    <div className={styles.analyticsCardSub} style={{ color: '#EF4444' }}>
                      <span>{analyticsData?.metrics?.totalReceipts || 0} scanned receipts</span>
                    </div>
                  </div>

                  {/* Next 30 Days Forecast */}
                  <div className={styles.analyticsCard}>
                    <div className={styles.analyticsCardTitle}>
                      <Sparkles size={16} color="#E8BA5A" /> 30-Day AI Forecast
                    </div>
                    <div className={styles.analyticsCardValue}>
                      ~${Math.round(analyticsData?.metrics?.nextMonthForecastUsd || 0).toLocaleString()}
                    </div>
                    <div className={styles.analyticsCardSub} style={{ color: '#8C8075' }}>
                      <span>៛{Math.round(analyticsData?.metrics?.nextMonthForecastKhr || 0).toLocaleString()} projected</span>
                    </div>
                  </div>

                  {/* Tax Compliance Score */}
                  <div className={styles.analyticsCard}>
                    <div className={styles.analyticsCardTitle}>
                      <ShieldCheck size={16} color="#7A222B" /> GDT Tax Compliance
                    </div>
                    <div className={styles.analyticsCardValue}>
                      {analyticsData?.metrics?.taxComplianceScore ?? 100}%
                    </div>
                    <div className={styles.analyticsCardSub} style={{ color: (analyticsData?.metrics?.taxComplianceScore ?? 100) >= 70 ? '#10B981' : '#F59E0B' }}>
                      <span>Valid TIN &amp; invoice rate</span>
                    </div>
                  </div>
                </div>

                {/* Visual Chart & Split Breakdown */}
                <div className={styles.analyticsTwoCol}>
                  {/* Left Column: Monthly Timeline Inflow vs Outflow */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className={styles.settingsCard} style={{ margin: 0 }}>
                      <div className={styles.settingsCardHeader}>
                        <div>
                          <div className={styles.settingsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LineChart size={18} /> Monthly Cashflow Comparison (Inflow vs Outflow)
                          </div>
                          <div className={styles.settingsCardDesc}>
                            Net balance comparison showing revenue collected vs business expense burn.
                          </div>
                        </div>
                      </div>

                      <div className={styles.timelineChartWrap}>
                        {analyticsData?.timeline && analyticsData.timeline.length > 0 ? (
                          analyticsData.timeline.map((item: any) => {
                            const maxVal = Math.max(1, ...analyticsData.timeline.map((t: any) => Math.max(t.incomeUsd, t.expenseUsd)));
                            const incPct = Math.min(100, Math.round((item.incomeUsd / maxVal) * 100));
                            const expPct = Math.min(100, Math.round((item.expenseUsd / maxVal) * 100));

                            return (
                              <div key={item.month} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                                  <span style={{ color: '#1F1916' }}>{item.month}</span>
                                  <span style={{ color: item.netUsd >= 0 ? '#10B981' : '#EF4444' }}>
                                    Net: {item.netUsd >= 0 ? '+' : ''}${Math.round(item.netUsd).toLocaleString()}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {/* Inflow bar */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', width: '50px', color: '#10B981', fontWeight: 600 }}>Inflow</span>
                                    <div style={{ flex: 1, height: '10px', background: '#E5E7EB', borderRadius: '5px', overflow: 'hidden' }}>
                                      <div style={{ width: `${incPct}%`, height: '100%', background: '#10B981', borderRadius: '5px' }} />
                                    </div>
                                    <span style={{ fontSize: '11px', width: '65px', textAlign: 'right', fontWeight: 600, color: '#1F1916' }}>
                                      ${Math.round(item.incomeUsd).toLocaleString()}
                                    </span>
                                  </div>
                                  {/* Outflow bar */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', width: '50px', color: '#EF4444', fontWeight: 600 }}>Outflow</span>
                                    <div style={{ flex: 1, height: '10px', background: '#E5E7EB', borderRadius: '5px', overflow: 'hidden' }}>
                                      <div style={{ width: `${expPct}%`, height: '100%', background: '#EF4444', borderRadius: '5px' }} />
                                    </div>
                                    <span style={{ fontSize: '11px', width: '65px', textAlign: 'right', fontWeight: 600, color: '#1F1916' }}>
                                      ${Math.round(item.expenseUsd).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ textAlign: 'center', padding: '24px', color: '#8C8075', fontSize: '13px' }}>
                            No monthly transaction records yet. As you scan receipts and log income, timeline bars will automatically render here.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Spend by Category */}
                    <div className={styles.settingsCard} style={{ margin: 0 }}>
                      <div className={styles.settingsCardHeader}>
                        <div>
                          <div className={styles.settingsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Tag size={18} /> Outflow Distribution by Category
                          </div>
                          <div className={styles.settingsCardDesc}>
                            Breakdown of where capital was deployed.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {analyticsData?.distributions?.expenseByCategory && Object.keys(analyticsData.distributions.expenseByCategory).length > 0 ? (
                          Object.entries(analyticsData.distributions.expenseByCategory).map(([cat, val]: any, idx) => {
                            const totalSpend = analyticsData.metrics.totalExpenseUsd || 1;
                            const pct = Math.round((val.usd / totalSpend) * 100);
                            const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                            return (
                              <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                                    {cat}
                                  </span>
                                  <span>${Math.round(val.usd).toLocaleString()} ({pct}%)</span>
                                </div>
                                <div style={{ height: '6px', background: '#F0ECE6', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px' }} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ textAlign: 'center', padding: '16px', color: '#8C8075', fontSize: '13px' }}>
                            No expense data logged yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Anomalies & Telegram Bot Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Anomalies Card */}
                    <div className={styles.settingsCard} style={{ margin: 0 }}>
                      <div className={styles.settingsCardHeader}>
                        <div>
                          <div className={styles.settingsCardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={18} color="#D97706" /> AI Anomaly &amp; Fraud Sentinel
                          </div>
                          <div className={styles.settingsCardDesc}>
                            Automated flags on unusual or duplicate expenditures.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {analyticsData?.anomalies && analyticsData.anomalies.length > 0 ? (
                          analyticsData.anomalies.map((ano: any) => (
                            <div
                              key={ano.id + ano.type}
                              style={{
                                padding: '10px 12px',
                                background: ano.type === 'DUPLICATE' ? '#FEF2F2' : '#FFFBEB',
                                border: `1px solid ${ano.type === 'DUPLICATE' ? '#FCA5A5' : '#FDE68A'}`,
                                borderRadius: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: ano.type === 'DUPLICATE' ? '#991B1B' : '#92400E' }}>
                                  {ano.title}
                                </span>
                                <span style={{ fontSize: '10px', color: '#8C8075' }}>{ano.date}</span>
                              </div>
                              <span style={{ fontSize: '11px', color: '#4B5563' }}>{ano.description}</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', padding: '24px 16px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                            <CheckCircle2 size={24} color="#16A34A" style={{ margin: '0 auto 6px auto' }} />
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>All Clear</div>
                            <div style={{ fontSize: '11px', color: '#15803D' }}>No duplicate receipts or irregular claims detected.</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN: CHATBOT */}
            {activeScreen === 'chatbot' && (
              <div className={styles.chatbotContainer}>
                {/* Header */}
                <div className={styles.chatbotHeader}>
                  <div>
                    <h2 className={styles.chatbotHeaderTitle}>
                      Chatbot
                    </h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={styles.chatbotBadgeLive}>
                      <span className={styles.chatbotBadgeLiveDot} />
                      Live Financial Ledger
                    </span>
                    <button
                      type="button"
                      className={styles.btnScanMore}
                      onClick={() => {
                        setChatMessages([
                          {
                            id: 'welcome-chat-' + Date.now(),
                            role: 'assistant',
                            content: `Hello! I am your **Komnottra Chatbot**.\n\nI can analyze your approved receipts, track client incomes, calculate your monthly burn rate, forecast cash runway, and break down spending by category or department.\n\nAsk me anything or tap one of the suggested prompts above!`,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          },
                        ]);
                      }}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      title="Reset chat history"
                    >
                      <RefreshCw size={13} /> Clear Chat
                    </button>
                  </div>
                </div>

                {/* Quick Suggestion Prompt Chips */}
                <div className={styles.chatbotPromptsBar}>
                  <button
                    type="button"
                    className={styles.chatbotPromptChip}
                    onClick={() => handleSendChatMessage('What is our monthly burn rate and estimated cash runway?')}
                    disabled={isChatLoading}
                  >
                    <Clock size={13} color="#7A222B" /> Burn rate &amp; cash runway
                  </button>
                  <button
                    type="button"
                    className={styles.chatbotPromptChip}
                    onClick={() => handleSendChatMessage('Summarize our approved expenses vs. income this month.')}
                    disabled={isChatLoading}
                  >
                    <TrendingUp size={13} color="#10B981" /> Expenses vs. Income summary
                  </button>
                  <button
                    type="button"
                    className={styles.chatbotPromptChip}
                    onClick={() => handleSendChatMessage('What are our highest spending categories and departments?')}
                    disabled={isChatLoading}
                  >
                    <Tag size={13} color="#D97706" /> Top spending categories
                  </button>
                  <button
                    type="button"
                    className={styles.chatbotPromptChip}
                    onClick={() => handleSendChatMessage('How many items are currently waiting in the Approvals queue?')}
                    disabled={isChatLoading}
                  >
                    <CheckSquare size={13} color="#2563EB" /> Approvals queue status
                  </button>
                  <button
                    type="button"
                    className={styles.chatbotPromptChip}
                    onClick={() => handleSendChatMessage('តើចំណូល និងការចំណាយសរុបរបស់ក្រុមហ៊ុនមានចំនួនប៉ុន្មាន?')}
                    disabled={isChatLoading}
                  >
                    <FileText size={13} /> សង្ខេបចំណូលចំណាយ (Khmer)
                  </button>
                </div>

                {/* Chat Messages Log */}
                <div className={styles.chatbotMessagesBox}>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.chatMsgRow} ${
                        msg.role === 'user' ? styles.chatMsgRowUser : styles.chatMsgRowAssistant
                      }`}
                    >
                      <div
                        className={
                          msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant
                        }
                      >
                        <div
                          className={`${styles.chatBubbleMeta} ${
                            msg.role === 'user' ? styles.chatBubbleMetaUser : ''
                          }`}
                        >
                          <div className={styles.chatSenderInfo}>
                            {msg.role === 'assistant' ? (
                              <>
                                <span className={styles.chatSenderAvatarAi}>
                                  <Sparkles size={14} />
                                </span>
                                <span>Komnottra Chatbot</span>
                              </>
                            ) : (
                              <>
                                <span className={styles.chatSenderAvatarUser}>
                                  <User size={14} />
                                </span>
                                <span>You (Owner)</span>
                              </>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={styles.chatTimestamp}>{msg.timestamp}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                alert('Message copied to clipboard!');
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : '#8C8075',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Copy message"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>

                        <div className={styles.chatBubbleText}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isChatLoading && (
                    <div className={styles.chatLoadingBubble}>
                      <Loader2 size={16} className={styles.spinner} />
                      <span>Analyzing your ledger...</span>
                    </div>
                  )}

                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Input Field */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage();
                  }}
                  className={styles.chatbotInputCard}
                >
                  <Bot size={20} color="#7A222B" style={{ opacity: 0.8 }} />
                  <input
                    type="text"
                    className={styles.chatbotTextInput}
                    placeholder="Ask about cashflow, runway, burn rate, approved expenses, or income..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatLoading}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className={styles.chatbotSendBtn}
                    disabled={!chatInput.trim() || isChatLoading}
                    title="Send message"
                  >
                    <Send size={18} />
                  </button>
                </form>

                <div className={styles.chatbotDisclaimer}>
                  <Lock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Private business conversation. Insights are calculated strictly from your workspace's approved transactions.
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Floating Quick Chatbot Trigger (Bottom Right of every page) */}
        {activeScreen !== 'chatbot' && (
          <button
            type="button"
            className={styles.floatingChatWidget}
            onClick={() => {
              if (currentUser?.role === 'OWNER') {
                setActiveScreen('chatbot');
              } else {
                alert('The Chatbot is reserved exclusively for Company Owners.');
              }
            }}
            title="Chatbot"
            aria-label="Open Chatbot"
          >
            <div className={styles.floatingChatIconWrap}>
              <Bot size={20} color="#FFFFFF" />
              <span className={styles.floatingChatPulseDot} />
            </div>
            <span className={styles.floatingChatLabel}>Chatbot</span>
          </button>
        )}

        {/* =========================================================================
            RECORD COMPANY INCOME / BILL MODAL
            ========================================================================= */}
        {isIncomeModalOpen && (
          <div className={styles.editReceiptModalBackdrop} onClick={() => setIsIncomeModalOpen(false)}>
            <div className={styles.editReceiptModalContent} style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.editReceiptModalHeader}>
                <div className={styles.editReceiptModalTitle}>
                  <DollarSign size={22} color="#10B981" />
                  <span>Record Company Income / Inflow</span>
                </div>
                <button
                  type="button"
                  className={styles.editReceiptModalClose}
                  onClick={() => setIsIncomeModalOpen(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateIncome} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.settingsFormGroup}>
                  <label className={styles.settingsLabel}>Client / Payer Name *</label>
                  <input
                    type="text"
                    required
                    className={styles.warmInput}
                    placeholder="e.g. Acme Corporation, Ministry of Commerce"
                    value={incomeForm.clientName}
                    onChange={(e) => setIncomeForm({ ...incomeForm, clientName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Invoice # / Bill ID</label>
                    <input
                      type="text"
                      className={styles.warmInput}
                      placeholder="e.g. INV-2026-001"
                      value={incomeForm.invoiceNo}
                      onChange={(e) => setIncomeForm({ ...incomeForm, invoiceNo: e.target.value })}
                    />
                  </div>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Client TIN (Optional)</label>
                    <input
                      type="text"
                      className={styles.warmInput}
                      placeholder="e.g. K001-901234567"
                      value={incomeForm.tin}
                      onChange={(e) => setIncomeForm({ ...incomeForm, tin: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Amount *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      className={styles.warmInput}
                      placeholder="0.00"
                      value={incomeForm.total}
                      onChange={(e) => setIncomeForm({ ...incomeForm, total: e.target.value })}
                    />
                  </div>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Currency</label>
                    <div className={styles.segmentedToggle} style={{ width: '100%', height: '42px' }}>
                      <button
                        type="button"
                        className={`${styles.segmentBtn} ${incomeForm.currency === 'USD' ? styles.segmentBtnActive : ''}`}
                        onClick={() => setIncomeForm({ ...incomeForm, currency: 'USD' })}
                      >
                        $ USD
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentBtn} ${incomeForm.currency === 'KHR' ? styles.segmentBtnActive : ''}`}
                        onClick={() => setIncomeForm({ ...incomeForm, currency: 'KHR' })}
                      >
                        ៛ KHR
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Category</label>
                    <select
                      className={styles.warmSelect}
                      value={incomeForm.category}
                      onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                    >
                      <option value="Client Services">Client Services</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Product Sales">Product Sales</option>
                      <option value="Monthly Retainer">Monthly Retainer</option>
                      <option value="Grant / Funding">Grant / Funding</option>
                      <option value="Other Revenue">Other Revenue</option>
                    </select>
                  </div>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Payment Method</label>
                    <select
                      className={styles.warmSelect}
                      value={incomeForm.paymentMethod}
                      onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value })}
                    >
                      <option value="KHQR / Bank Transfer">KHQR / Bank Transfer</option>
                      <option value="ABA PayWay">ABA PayWay</option>
                      <option value="Cash">Cash</option>
                      <option value="Wing / TrueMoney">Wing / TrueMoney</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Date</label>
                    <input
                      type="date"
                      className={styles.warmInput}
                      value={incomeForm.date}
                      onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    />
                  </div>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Status</label>
                    <select
                      className={styles.warmSelect}
                      value={incomeForm.status}
                      onChange={(e) => setIncomeForm({ ...incomeForm, status: e.target.value as any })}
                    >
                      <option value="RECEIVED">RECEIVED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="OVERDUE">OVERDUE</option>
                    </select>
                  </div>
                </div>

                <div className={styles.settingsFormGroup}>
                  <label className={styles.settingsLabel}>Reference / Notes</label>
                  <input
                    type="text"
                    className={styles.warmInput}
                    placeholder="e.g. Q3 payment via ABA Bank"
                    value={incomeForm.reference}
                    onChange={(e) => setIncomeForm({ ...incomeForm, reference: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setIsIncomeModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.btnApproveReport}
                    disabled={isSavingIncome}
                    style={{ width: 'auto', padding: '10px 24px' }}
                  >
                    {isSavingIncome ? 'Saving...' : 'Save Income Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            INSPECT & EDIT RECEIPT POPUP MODAL ("The Pop-up Thingy")
            ========================================================================= */}
        {editingReceipt && (
          <div className={styles.editReceiptModalBackdrop} onClick={handleCloseEditModal}>
            <div className={styles.editReceiptModalContent} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className={styles.editReceiptModalHeader}>
                <div className={styles.editReceiptModalTitle}>
                  <Receipt size={20} color="#7A222B" />
                  <span>Inspect &amp; Edit Receipt</span>
                  {editingReceipt.receiptNo && editingReceipt.receiptNo !== '—' && (
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#8C8075' }}>
                      (#{editingReceipt.receiptNo})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.editReceiptModalClose}
                  onClick={handleCloseEditModal}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile Segmented Tab Bar */}
              <div className={styles.modalMobileTabBar}>
                <button
                  type="button"
                  className={`${styles.modalMobileTabBtn} ${modalMobileTab === 'both' ? styles.modalMobileTabBtnActive : ''}`}
                  onClick={() => setModalMobileTab('both')}
                >
                  <SplitSquareVertical size={13} /> Both
                </button>
                <button
                  type="button"
                  className={`${styles.modalMobileTabBtn} ${modalMobileTab === 'photo' ? styles.modalMobileTabBtnActive : ''}`}
                  onClick={() => setModalMobileTab('photo')}
                >
                  <Camera size={13} /> Photo
                </button>
                <button
                  type="button"
                  className={`${styles.modalMobileTabBtn} ${modalMobileTab === 'form' ? styles.modalMobileTabBtnActive : ''}`}
                  onClick={() => setModalMobileTab('form')}
                >
                  <Edit3 size={13} /> Details
                </button>
              </div>

              {/* Body: Split View (Image on left, Form on right) */}
              <form onSubmit={handleSaveEditReceipt} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
                <div className={styles.editReceiptModalBody}>
                  {/* Left: Receipt Image Preview */}
                  {(modalMobileTab === 'both' || modalMobileTab === 'photo') && (
                    <div className={styles.editReceiptImagePanel}>
                      {editingReceipt.imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={editingReceipt.imageUrl}
                            alt={editingReceipt.payee}
                            className={styles.editReceiptImage}
                            onClick={() => {
                              setFullscreenPhotoUrl(editingReceipt.imageUrl);
                              setIsLightboxZoomed(false);
                            }}
                            style={{ cursor: 'zoom-in' }}
                            title="Tap to zoom full screen"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src.includes('/uploads/') && !target.src.includes('/api/uploads/')) {
                                target.src = target.src.replace('/uploads/', '/api/uploads/');
                              }
                            }}
                          />
                          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setFullscreenPhotoUrl(editingReceipt.imageUrl);
                                setIsLightboxZoomed(false);
                              }}
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#7A222B',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FFFFFF',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid #E5DCD0',
                                cursor: 'pointer',
                              }}
                            >
                              <Maximize2 size={13} /> Tap to Zoom Full Screen
                            </button>
                            <a
                              href={editingReceipt.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#5A514B',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                textDecoration: 'none',
                                background: '#FFFFFF',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #E5DCD0',
                              }}
                            >
                              <ExternalLink size={12} /> Open File
                            </a>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#8C8075', padding: '30px' }}>
                          <Receipt size={48} color="#B45309" />
                          <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '8px' }}>No Image File</div>
                          <div style={{ fontSize: '11px' }}>Manually created or text import</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Right: Editable Fields */}
                  {(modalMobileTab === 'both' || modalMobileTab === 'form') && (
                    <div className={styles.editReceiptFormGrid}>
                      <div className={styles.modalTipBanner}>
                        <Lightbulb size={16} color="#D97706" style={{ flexShrink: 0 }} />
                        <span>Compare with the original photo. Changes automatically recalculate book equivalents and live reports.</span>
                      </div>

                      <div>
                        <label className={styles.inputLabel}>Payee / Vendor Name *</label>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={editFormData.payee}
                          onChange={(e) => setEditFormData({ ...editFormData, payee: e.target.value })}
                          placeholder="e.g. Starbucks, Chip Mong Supermarket"
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                        <div>
                          <label className={styles.inputLabel}>Total Amount *</label>
                          <input
                            type="number"
                            step="any"
                            className={styles.inputField}
                            value={editFormData.total}
                            onChange={(e) => setEditFormData({ ...editFormData, total: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <label className={styles.inputLabel}>Currency *</label>
                          <div className={styles.currencyToggleContainer}>
                            <button
                              type="button"
                              className={`${styles.currencyToggleBtn} ${editFormData.currency === 'KHR' ? styles.currencyToggleBtnActiveKhr : ''}`}
                              onClick={() => setEditFormData({ ...editFormData, currency: 'KHR' })}
                            >
                              ៛ KHR
                            </button>
                            <button
                              type="button"
                              className={`${styles.currencyToggleBtn} ${editFormData.currency === 'USD' ? styles.currencyToggleBtnActiveUsd : ''}`}
                              onClick={() => setEditFormData({ ...editFormData, currency: 'USD' })}
                            >
                              $ USD
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Live Dual Currency Conversion Card */}
                      {(() => {
                        const numTotal = parseFloat(editFormData.total) || 0;
                        const rate = workspaceSettings.exchangeRate || 4100;
                        const isUsd = editFormData.currency === 'USD';
                        const convertedAmount = isUsd ? Math.round(numTotal * rate) : numTotal / rate;
                        const formattedConverted = isUsd
                          ? `${convertedAmount.toLocaleString()} ៛ KHR`
                          : `$${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

                        return (
                          <div className={styles.dualCurrencyCalcCard}>
                            <div className={styles.dualCurrencyHeaderRow}>
                              <span className={styles.dualCurrencyTitle}>
                                <TrendingUp size={13} color="#7A222B" /> Dual Currency Exchange (1 USD = {rate.toLocaleString()} ៛)
                              </span>
                              <span className={styles.dualCurrencyBaseBadge}>
                                Master Ledger: {workspaceSettings.baseCurrency}
                              </span>
                            </div>
                            <div className={styles.dualCurrencyValuesRow}>
                              <div className={styles.dualCurrencyCol}>
                                <span className={styles.dualCurrencyLabel}>Paid Amount</span>
                                <span className={styles.dualCurrencyPrimaryVal}>
                                  {isUsd ? `$${numTotal.toFixed(2)} USD` : `${Math.round(numTotal).toLocaleString()} ៛ KHR`}
                                </span>
                              </div>
                              <span className={styles.dualCurrencyArrow}>
                                <ArrowRight size={14} />
                              </span>
                              <div className={styles.dualCurrencyCol} style={{ textAlign: 'right' }}>
                                <span className={styles.dualCurrencyLabel}>Book Equivalent ({isUsd ? 'KHR' : 'USD'})</span>
                                <span className={styles.dualCurrencyEquivVal}>
                                  {formattedConverted}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className={styles.inputLabel}>Date (DD/MM/YYYY)</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            value={editFormData.date}
                            onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                            placeholder="04/10/2026"
                          />
                        </div>

                        <div>
                          <label className={styles.inputLabel}>VAT Amount</label>
                          <input
                            type="number"
                            step="any"
                            className={styles.inputField}
                            value={editFormData.vat}
                            onChange={(e) => setEditFormData({ ...editFormData, vat: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className={styles.inputLabel}>Invoice / Receipt #</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            value={editFormData.receiptNo}
                            onChange={(e) => setEditFormData({ ...editFormData, receiptNo: e.target.value })}
                            placeholder="e.g. INV-1094"
                          />
                        </div>

                        <div>
                          <label className={styles.inputLabel}>Vendor TIN / Tax ID</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            value={editFormData.vendorTin}
                            onChange={(e) => setEditFormData({ ...editFormData, vendorTin: e.target.value })}
                            placeholder="e.g. K008-902..."
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className={styles.inputLabel}>Expense Category</label>
                          <select
                            className={styles.selectField}
                            value={editFormData.expenseCode}
                            onChange={(e) => setEditFormData({ ...editFormData, expenseCode: e.target.value })}
                          >
                            {workspaceSettings.expenseCodes.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            {editFormData.expenseCode && !workspaceSettings.expenseCodes.includes(editFormData.expenseCode) && (
                              <option value={editFormData.expenseCode}>{editFormData.expenseCode}</option>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className={styles.inputLabel}>Department</label>
                          <select
                            className={styles.selectField}
                            value={editFormData.department}
                            onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                          >
                            {workspaceSettings.departments.map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                            {editFormData.department && !workspaceSettings.departments.includes(editFormData.department) && (
                              <option value={editFormData.department}>{editFormData.department}</option>
                            )}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className={styles.inputLabel}>Notes / Purpose</label>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          placeholder="e.g. Client lunch meeting"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className={styles.editReceiptModalFooter}>
                  <button
                    type="button"
                    className={styles.btnDeleteReceipt}
                    onClick={() => handleDeleteReceipt(editingReceipt.id)}
                    disabled={isDeletingReceipt || isSavingEdit}
                  >
                    <Trash2 size={14} />
                    {isDeletingReceipt ? 'Deleting...' : 'Delete Receipt'}
                  </button>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className={styles.btnSecondarySm}
                      onClick={handleCloseEditModal}
                      disabled={isSavingEdit}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.btnApproveReport}
                      style={{ width: 'auto', padding: '10px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      disabled={isSavingEdit || isDeletingReceipt}
                    >
                      {isSavingEdit ? (
                        <>
                          <Loader2 size={15} className={styles.spinning} /> Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save size={15} /> Save Changes
                        </>
                      )}
                    </button>
                    {editingReceipt.status === 'PENDING' && currentUser?.role === 'OWNER' && (
                      <button
                        type="button"
                        style={{
                          background: '#15803D',
                          borderColor: '#15803D',
                          color: '#FFF',
                          borderRadius: '10px',
                          border: 'none',
                          padding: '10px 18px',
                          fontSize: '13px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                        onClick={async (e) => {
                          await handleSaveEditReceipt(e);
                          await handleQueueDecision(editingReceipt.id, 'approve');
                        }}
                        disabled={isSavingEdit || isDeletingReceipt}
                      >
                        <CheckCheck size={15} /> Save & Approve
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            INSPECT & EDIT CLIENT INCOME POPUP MODAL
            ========================================================================= */}
        {editingIncome && (
          <div className={styles.editReceiptModalBackdrop} onClick={handleCloseEditIncomeModal}>
            <div className={styles.editReceiptModalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
              <div className={styles.editReceiptModalHeader}>
                <div className={styles.editReceiptModalTitle}>
                  <DollarSign size={20} color="#15803D" />
                  <span>Inspect &amp; Edit Income</span>
                  {editingIncome.invoiceNo && (
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#8C8075' }}>
                      (#{editingIncome.invoiceNo})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.editReceiptModalClose}
                  onClick={handleCloseEditIncomeModal}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={(e) => handleSaveEditIncome(e, false)} style={{ display: 'flex', flexDirection: 'column', flex: 1, margin: 0 }}>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Client / Payer Name *</label>
                    <input
                      type="text"
                      required
                      className={styles.warmInput}
                      value={editIncomeFormData.clientName}
                      onChange={(e) => setEditIncomeFormData({ ...editIncomeFormData, clientName: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Invoice # / Bill ID</label>
                      <input
                        type="text"
                        className={styles.warmInput}
                        value={editIncomeFormData.invoiceNo}
                        onChange={(e) => setEditIncomeFormData({ ...editIncomeFormData, invoiceNo: e.target.value })}
                      />
                    </div>
                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Client TIN (Optional)</label>
                      <input
                        type="text"
                        className={styles.warmInput}
                        value={editIncomeFormData.tin}
                        onChange={(e) => setEditIncomeFormData({ ...editIncomeFormData, tin: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Amount *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        className={styles.warmInput}
                        value={editIncomeFormData.total}
                        onChange={(e) => setEditIncomeFormData({ ...editIncomeFormData, total: e.target.value })}
                      />
                    </div>
                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Currency</label>
                      <select
                        className={styles.warmInput}
                        value={editIncomeFormData.currency}
                        onChange={(e) => setEditIncomeFormData({ ...editIncomeFormData, currency: e.target.value as 'USD' | 'KHR' })}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="KHR">KHR (៛)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Category</label>
                      <select
                        className={styles.warmInput}
                        value={editIncomeFormData.category}
                        onChange={(e) => setEditIncomeFormData({ ...editIncomeFormData, category: e.target.value })}
                      >
                        <option value="Client Services">Client Services</option>
                        <option value="Retainer Fee">Retainer Fee</option>
                        <option value="Product Sales">Product Sales</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Grant / Investment">Grant / Investment</option>
                        <option value="Other Revenue">Other Revenue</option>
                      </select>
                    </div>
                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Payment Method</label>
                      <select
                        className={styles.warmInput}
                        value={editIncomeFormData.paymentMethod}
                        onChange={(e) => setEditIncomeFormData({ ...editIncomeFormData, paymentMethod: e.target.value })}
                      >
                        <option value="KHQR / Bank Transfer">KHQR / Bank Transfer</option>
                        <option value="ABA Pay">ABA Pay</option>
                        <option value="Cash">Cash</option>
                        <option value="Wire Transfer">Wire Transfer</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Payment Date</label>
                      <input
                        type="date"
                        className={styles.warmInput}
                        value={editIncomeFormData.date}
                        onChange={(e) => setEditIncomeFormData({ ...editIncomeFormData, date: e.target.value })}
                      />
                    </div>
                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Reference / Transaction Code</label>
                      <input
                        type="text"
                        className={styles.warmInput}
                        placeholder="e.g. TXN-998822"
                        value={editIncomeFormData.reference}
                        onChange={(e) => setEditIncomeFormData({ ...editIncomeFormData, reference: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.editReceiptModalFooter}>
                  <button
                    type="button"
                    className={styles.btnDeleteReceipt}
                    onClick={() => {
                      handleDeleteIncome(editingIncome.id);
                      setEditingIncome(null);
                    }}
                  >
                    <Trash2 size={14} /> Delete Record
                  </button>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className={styles.btnSecondarySm}
                      onClick={handleCloseEditIncomeModal}
                      disabled={isSavingEditIncome}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.btnApproveReport}
                      style={{ width: 'auto', padding: '10px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      disabled={isSavingEditIncome}
                    >
                      {isSavingEditIncome ? <Loader2 size={15} className={styles.spinning} /> : <Save size={15} />}
                      Save Changes
                    </button>
                    {editingIncome.status === 'PENDING' && currentUser?.role === 'OWNER' && (
                      <button
                        type="button"
                        style={{
                          background: '#15803D',
                          borderColor: '#15803D',
                          color: '#FFF',
                          borderRadius: '10px',
                          border: 'none',
                          padding: '10px 18px',
                          fontSize: '13px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => handleSaveEditIncome(e, true)}
                        disabled={isSavingEditIncome}
                      >
                        <CheckCheck size={15} /> Save &amp; Approve
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Backdrop Overlay for Mobile Drawer */}
        {isMobileSidebarOpen && (
          <div
            className={styles.sidebarBackdrop}
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close sidebar backdrop"
          />
        )}

        {/* Modern Mobile Bottom Navigation Bar (Visible on Mobile) */}
        <nav className={styles.mobileBottomNav} aria-label="Mobile Navigation">
          <button
            type="button"
            className={`${styles.mobileNavItem} ${activeScreen === 'home' ? styles.mobileNavItemActive : ''}`}
            onClick={() => setActiveScreen('home')}
          >
            <Home size={20} />
            <span>{t.home}</span>
          </button>

          <button
            type="button"
            className={`${styles.mobileNavItem} ${activeScreen === 'approvals' ? styles.mobileNavItemActive : ''}`}
            onClick={() => {
              if (currentUser?.role === 'OWNER') {
                setActiveScreen('approvals');
              } else {
                alert('Approvals are reserved for Company Finance Leads. Your submitted receipts are currently pending review.');
              }
            }}
          >
            <div style={{ position: 'relative' }}>
              <CheckSquare size={20} />
              {approvalQueue.length > 0 && currentUser?.role === 'OWNER' && (
                <span className={styles.mobileBadgeDot}>{approvalQueue.length}</span>
              )}
            </div>
            <span>{t.approvals}</span>
          </button>

          {/* Floating Quick Scan Action Button */}
          <button
            type="button"
            className={styles.mobileFloatingScanBtn}
            onClick={() => {
              setActiveScreen('scan');
              if (window.innerWidth <= 768) {
                mobileCameraInputRef.current?.click();
              }
            }}
            aria-label="Scan Receipt"
          >
            <Camera size={24} />
          </button>

          <button
            type="button"
            className={`${styles.mobileNavItem} ${activeScreen === 'reports' ? styles.mobileNavItemActive : ''}`}
            onClick={() => setActiveScreen('reports')}
          >
            <FileSpreadsheet size={20} />
            <span>{t.reports}</span>
          </button>

          <button
            type="button"
            className={`${styles.mobileNavItem} ${isMobileSidebarOpen ? styles.mobileNavItemActive : ''}`}
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu size={20} />
            <span>Menu</span>
          </button>
        </nav>

        {/* Fullscreen Photo Lightbox for Mobile / Desktop */}
        {fullscreenPhotoUrl && (
          <div className={styles.lightboxBackdrop} onClick={() => setFullscreenPhotoUrl(null)}>
            <div className={styles.lightboxHeader}>
              <button
                type="button"
                className={styles.lightboxCloseBtn}
                onClick={() => setFullscreenPhotoUrl(null)}
                title="Close Full Screen"
                aria-label="Close Full Screen"
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.lightboxImageContainer} onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullscreenPhotoUrl}
                alt="Receipt full size"
                className={`${styles.lightboxImage} ${isLightboxZoomed ? styles.lightboxImageZoomed : ''}`}
                onClick={() => setIsLightboxZoomed(!isLightboxZoomed)}
                title={isLightboxZoomed ? 'Tap to zoom out' : 'Tap to zoom in'}
              />
            </div>
            <div style={{ color: '#F6F1EA', fontSize: '12px', marginTop: '12px', textAlign: 'center', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {isLightboxZoomed ? (
                <>
                  <ZoomOut size={14} />
                  <span>Tap photo to zoom out</span>
                </>
              ) : (
                <>
                  <ZoomIn size={14} />
                  <span>Tap photo to zoom in · Tap outside or close button</span>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
