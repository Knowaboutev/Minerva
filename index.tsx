import React, { useState, useEffect, useContext, createContext } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard,
  ClipboardList,
  Cpu,
  Package,
  CheckCircle,
  Menu,
  Bell,
  Search,
  User,
  Play,
  Pause,
  Square,
  AlertTriangle,
  ArrowRightLeft,
  History,
  Settings,
  X,
  Plus,
  Filter,
  MoreVertical,
  LogOut,
  Smartphone,
  Monitor,
  BarChart3,
  TrendingUp,
  PieChart,
  AlertCircle,
  Check,
  Truck,
  Wrench,
  Calendar,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  MessageCircle,
  Trash2,
  Eye,
  Printer,
  ListOrdered,
  ChevronRight,
  Zap,
  Save,
  Clock,
  QrCode,
  FileCheck,
  Factory
} from 'lucide-react';

// --- Types ---

type Role = 'ADMIN' | 'PLANNER' | 'OPERATOR' | 'QUALITY';
type MachineStatus = 'IDLE' | 'RUNNING' | 'DOWN' | 'MAINTENANCE';
type JobStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'QC_PENDING' | 'COMPLETED' | 'HOLD' | 'CANCELLED';
type CustomerType = 'CONTRACT' | 'INDIVIDUAL';

interface Machine {
  id: string;
  name: string;
  type: string;
  status: MachineStatus;
  currentOperatorId?: string;
  currentJobId?: string;
  efficiency: number; 
  lastMaintenance: string;
  nextMaintenance: string;
  totalRunHours: number;
}

interface MaintenanceLog {
    id: string;
    machineId: string;
    type: 'PREVENTIVE' | 'BREAKDOWN';
    description: string;
    date: string;
    technician: string;
    status: 'SCHEDULED' | 'COMPLETED';
}

interface JobOperation {
    id: string;
    sequence: number;
    description: string;
    workCenter: string; // e.g., VMC, Turning, QC
    estTime: number; // minutes
    status: 'PENDING' | 'COMPLETED';
}

interface Job {
  id: string;
  customerType: CustomerType;
  customer: string;
  contractId?: string; // For Contract orders
  contactPerson?: string; // For Individual orders
  partName: string;
  drawingNo: string;
  revision: string;
  qty: number;
  completedQty: number;
  scrapQty: number;
  rejectedQty?: number;
  status: JobStatus;
  currentMachineId?: string;
  assignedOperatorId?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  materialId?: string;
  specialInstructions?: string;
  operations: JobOperation[];
  logs: JobLog[];
  totalCycleTime?: number; // Calculated from ops
}

interface JobLog {
  id: string;
  timestamp: string;
  type: 'START' | 'PAUSE' | 'RESUME' | 'QC_SUBMIT' | 'QC_APPROVE' | 'COMPLETE' | 'HOLD' | 'TRANSFER' | 'INFO';
  message: string;
  user: string;
}

interface Material {
  id: string;
  name: string;
  sku: string;
  stock: number;
  unit: string;
  minLevel: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'CRITICAL';
}

interface MaterialTransaction {
    id: string;
    materialId: string;
    type: 'INWARD' | 'OUTWARD';
    qty: number;
    date: string;
    reference: string; // PO Number or Job ID
    performedBy: string;
}

interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
}

// --- Mock Data ---

const INITIAL_MACHINES: Machine[] = [
  { id: 'M-001', name: 'VMC-Haas-VF2', type: 'VMC', status: 'RUNNING', currentJobId: 'JOB-101', currentOperatorId: 'OP-01', efficiency: 92, lastMaintenance: '2023-10-15', nextMaintenance: '2023-11-15', totalRunHours: 1240 },
  { id: 'M-002', name: 'CNC-Turn-01', type: 'Turning', status: 'IDLE', efficiency: 85, lastMaintenance: '2023-10-01', nextMaintenance: '2023-11-01', totalRunHours: 850 },
  { id: 'M-003', name: 'Wirecut-Sodic', type: 'Wirecut', status: 'DOWN', efficiency: 45, lastMaintenance: '2023-09-20', nextMaintenance: '2023-10-20', totalRunHours: 2100 },
  { id: 'M-004', name: 'Grinder-Surface', type: 'Grinding', status: 'MAINTENANCE', efficiency: 78, lastMaintenance: '2023-10-25', nextMaintenance: '2023-11-25', totalRunHours: 430 },
];

const INITIAL_MAINTENANCE: MaintenanceLog[] = [
    { id: 'MT-01', machineId: 'M-004', type: 'PREVENTIVE', description: 'Monthly Lubrication & Alignment', date: '2023-11-05', technician: 'Service Team A', status: 'SCHEDULED' },
    { id: 'MT-02', machineId: 'M-003', type: 'BREAKDOWN', description: 'Wire Guide Replacement', date: '2023-11-04', technician: 'External Vendor', status: 'COMPLETED' }
];

const INITIAL_JOBS: Job[] = [
  {
    id: 'JOB-101',
    customerType: 'CONTRACT',
    customer: 'Tata Motors',
    contractId: 'CTR-2023-001',
    partName: 'Gear Box Housing',
    drawingNo: 'TM-GBH-001',
    revision: 'v2',
    qty: 50,
    completedQty: 12,
    scrapQty: 0,
    status: 'RUNNING',
    currentMachineId: 'M-001',
    assignedOperatorId: 'OP-01',
    priority: 'HIGH',
    dueDate: '2023-11-20',
    materialId: 'MAT-01',
    specialInstructions: 'Ensure surface finish Ra 1.6 on mating faces.',
    operations: [
        { id: 'op1', sequence: 10, description: 'Rough Facing', workCenter: 'VMC', estTime: 15, status: 'COMPLETED' },
        { id: 'op2', sequence: 20, description: 'Drill & Tap M10', workCenter: 'VMC', estTime: 8, status: 'PENDING' },
        { id: 'op3', sequence: 30, description: 'Final Inspection', workCenter: 'QC', estTime: 5, status: 'PENDING' }
    ],
    logs: [
      { id: 'l1', timestamp: '09:00', type: 'START', message: 'Job Started', user: 'Ramesh' }
    ]
  },
  {
    id: 'JOB-102',
    customerType: 'CONTRACT',
    customer: 'Mahindra',
    contractId: 'CTR-2023-045',
    partName: 'Axle Shaft',
    drawingNo: 'MM-AX-22',
    revision: 'v1',
    qty: 100,
    completedQty: 100,
    scrapQty: 2,
    status: 'QC_PENDING',
    currentMachineId: 'M-002',
    assignedOperatorId: 'OP-01',
    priority: 'MEDIUM',
    dueDate: '2023-11-25',
    materialId: 'MAT-02',
    specialInstructions: 'Check concentricity after turning.',
    operations: [
        { id: 'op1', sequence: 10, description: 'Turning OD', workCenter: 'Turning', estTime: 12, status: 'COMPLETED' },
        { id: 'op2', sequence: 20, description: 'Grooving', workCenter: 'Turning', estTime: 4, status: 'COMPLETED' }
    ],
    logs: [
       { id: 'l2a', timestamp: '08:00', type: 'START', message: 'Job Started', user: 'Ramesh' },
       { id: 'l2b', timestamp: '14:30', type: 'QC_SUBMIT', message: 'Submitted for QC inspection', user: 'Ramesh' }
    ]
  },
  {
    id: 'JOB-103',
    customerType: 'INDIVIDUAL',
    customer: 'Bosch',
    contactPerson: 'Mr. Adithya',
    partName: 'Fuel Pump Base',
    drawingNo: 'B-FP-99',
    revision: 'v3',
    qty: 200,
    completedQty: 45,
    scrapQty: 2,
    status: 'HOLD',
    currentMachineId: 'M-002',
    assignedOperatorId: 'OP-02',
    priority: 'LOW',
    dueDate: '2023-12-01',
    operations: [
        { id: 'op1', sequence: 10, description: 'Profile Cutting', workCenter: 'Wirecut', estTime: 45, status: 'PENDING' }
    ],
    logs: [
      { id: 'l3', timestamp: '10:30', type: 'HOLD', message: 'Material shortage detected', user: 'Supervisor' }
    ]
  },
];

const INITIAL_MATERIALS: Material[] = [
    { id: 'MAT-01', name: 'Aluminium 6061 Block', sku: 'AL-6061-BLK', stock: 45, unit: 'pcs', minLevel: 20, status: 'IN_STOCK' },
    { id: 'MAT-02', name: 'SS 304 Rod Ø20mm', sku: 'SS-304-R20', stock: 120, unit: 'meters', minLevel: 50, status: 'IN_STOCK' },
    { id: 'MAT-03', name: 'Coolant Oil - Synthetic', sku: 'COOL-SYN-200', stock: 15, unit: 'liters', minLevel: 40, status: 'CRITICAL' },
    { id: 'MAT-04', name: 'Carbide Insert TNMG', sku: 'INS-TNMG-16', stock: 24, unit: 'box', minLevel: 30, status: 'LOW_STOCK' },
];

const INITIAL_TRANSACTIONS: MaterialTransaction[] = [
    { id: 'TRX-01', materialId: 'MAT-01', type: 'INWARD', qty: 50, date: '2023-11-01', reference: 'PO-9921', performedBy: 'Store Keeper' },
    { id: 'TRX-02', materialId: 'MAT-02', type: 'OUTWARD', qty: 10, date: '2023-11-02', reference: 'JOB-101', performedBy: 'Ramesh' },
    { id: 'TRX-03', materialId: 'MAT-01', type: 'OUTWARD', qty: 5, date: '2023-11-03', reference: 'JOB-101', performedBy: 'Ramesh' },
    { id: 'TRX-04', materialId: 'MAT-04', type: 'INWARD', qty: 100, date: '2023-10-25', reference: 'PO-9000', performedBy: 'Admin' },
];

const INITIAL_USERS: User[] = [
  { id: 'ADMIN-01', name: 'Vikram Seth (Planner)', role: 'PLANNER', avatar: 'https://i.pravatar.cc/150?u=a' },
  { id: 'OP-01', name: 'Ramesh Kumar', role: 'OPERATOR', avatar: 'https://i.pravatar.cc/150?u=b' },
  { id: 'OP-02', name: 'Suresh Yadav', role: 'OPERATOR', avatar: 'https://i.pravatar.cc/150?u=c' },
];

// --- Context ---

interface AppContextType {
  user: User | null;
  users: User[];
  login: (userId: string) => void;
  logout: () => void;
  createUser: (user: User) => void;
  jobs: Job[];
  machines: Machine[];
  materials: Material[];
  maintenanceLogs: MaintenanceLog[];
  materialTransactions: MaterialTransaction[];
  createJob: (job: Job) => void;
  updateJobStatus: (jobId: string, status: JobStatus, logMsg: string, extra?: Partial<Job>) => void;
  addLog: (jobId: string, type: JobLog['type'], message: string) => void;
  machinesStatusUpdate: (machineId: string, status: MachineStatus, jobId?: string) => void;
  updateMaterialStock: (id: string, qty: number, type: 'INWARD' | 'OUTWARD', ref: string) => void;
  scheduleMaintenance: (log: MaintenanceLog) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [machines, setMachines] = useState<Machine[]>(INITIAL_MACHINES);
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(INITIAL_MAINTENANCE);
  const [materialTransactions, setMaterialTransactions] = useState<MaterialTransaction[]>(INITIAL_TRANSACTIONS);
  const [toasts, setToasts] = useState<{id: number, msg: string, type: string}[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const login = (userId: string) => {
    const u = users.find(u => u.id === userId);
    if (u) setUser(u);
  };

  const logout = () => setUser(null);

  const createUser = (newUser: User) => {
      setUsers(prev => [...prev, newUser]);
      showToast('User Created Successfully', 'success');
  };

  const createJob = (newJob: Job) => {
      setJobs(prev => [...prev, newJob]);
      showToast(`Job ${newJob.id} created successfully`, 'success');
  };

  const addLog = (jobId: string, type: JobLog['type'], message: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          logs: [...j.logs, {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type,
            message,
            user: user?.name || 'System'
          }]
        };
      }
      return j;
    }));
  };

  const updateJobStatus = (jobId: string, status: JobStatus, logMsg: string, extra?: Partial<Job>) => {
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        return { ...j, status, ...extra };
      }
      return j;
    }));
    
    // Determine log type based on status
    let logType: JobLog['type'] = 'INFO';
    if (status === 'RUNNING') logType = 'START';
    if (status === 'PAUSED') logType = 'PAUSE';
    if (status === 'QC_PENDING') logType = 'QC_SUBMIT';
    if (status === 'COMPLETED') logType = 'COMPLETE'; 
    
    addLog(jobId, logType, logMsg);
    
    // Sync machine status logic
    const job = jobs.find(j => j.id === jobId);
    if (job && job.currentMachineId) {
      let newMachineStatus: MachineStatus = 'IDLE';
      
      if (status === 'RUNNING') {
          newMachineStatus = 'RUNNING';
      } else if (status === 'QC_PENDING' || status === 'COMPLETED') {
          newMachineStatus = 'IDLE'; 
      } else if (status === 'PAUSED') {
          newMachineStatus = 'IDLE';
      }

      const machineJobId = status === 'RUNNING' ? jobId : undefined;
      machinesStatusUpdate(job.currentMachineId, newMachineStatus, machineJobId);
    }
  };

  const machinesStatusUpdate = (machineId: string, status: MachineStatus, jobId?: string) => {
    setMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        return { ...m, status, currentJobId: jobId || undefined };
      }
      return m;
    }));
  };

  const updateMaterialStock = (id: string, qty: number, type: 'INWARD' | 'OUTWARD', ref: string) => {
      setMaterials(prev => prev.map(m => {
          if (m.id === id) {
              const newStock = type === 'INWARD' ? m.stock + qty : m.stock - qty;
              return { 
                  ...m, 
                  stock: newStock,
                  status: newStock <= 0 ? 'CRITICAL' : newStock < m.minLevel ? 'LOW_STOCK' : 'IN_STOCK'
              };
          }
          return m;
      }));
      setMaterialTransactions(prev => [...prev, {
          id: `TRX-${Date.now()}`,
          materialId: id,
          type,
          qty,
          date: new Date().toLocaleDateString(),
          reference: ref,
          performedBy: user?.name || 'System'
      }]);
      showToast(`Material ${type} Updated: ${qty}`, 'success');
  };

  const scheduleMaintenance = (log: MaintenanceLog) => {
      setMaintenanceLogs(prev => [...prev, log]);
      showToast('Maintenance Task Scheduled', 'success');
  }

  return (
    <AppContext.Provider value={{ user, users, login, logout, createUser, jobs, machines, materials, maintenanceLogs, materialTransactions, createJob, updateJobStatus, addLog, machinesStatusUpdate, updateMaterialStock, scheduleMaintenance, showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
         {toasts.map(t => (
           <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 animate-slide-up ${t.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : t.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-slate-800'}`}>
             {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
             {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
             {t.msg}
           </div>
         ))}
      </div>
    </AppContext.Provider>
  );
};

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// --- Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        {title && <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'orange' | 'indigo' }> = ({ children, color = 'gray' }) => {
  const colors = {
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>{children}</span>;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'orange' | 'indigo'> = {
    RUNNING: 'green',
    COMPLETED: 'indigo',
    PAUSED: 'yellow',
    PENDING: 'gray',
    HOLD: 'red',
    IDLE: 'yellow',
    DOWN: 'red',
    MAINTENANCE: 'red',
    QC_PENDING: 'orange',
    IN_STOCK: 'green',
    LOW_STOCK: 'yellow',
    CRITICAL: 'red',
    CONTRACT: 'purple',
    INDIVIDUAL: 'blue',
    SCHEDULED: 'blue',
    INWARD: 'green',
    OUTWARD: 'orange'
  };
  const label = status === 'QC_PENDING' ? 'QC PENDING' : status.replace('_', ' ');
  return <Badge color={map[status] || 'gray'}>{label}</Badge>;
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' }> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-3xl',
      xl: 'max-w-5xl',
      full: 'max-w-[95vw] h-[90vh]'
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} relative animate-fade-in flex flex-col my-auto border border-slate-200`}>
        <div className="flex justify-between items-center p-4 border-b bg-slate-50/50 rounded-t-xl flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-red-500 transition-colors" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// --- Digital Job Card / Traveler Component ---
// This is used in the Modal AND inside the creation wizard as a preview
const DigitalTraveler: React.FC<{ job: Job }> = ({ job }) => {
    const { materials } = useApp();
    const material = materials.find(m => m.id === job.materialId);
    const totalEstTime = job.operations.reduce((acc, op) => acc + op.estTime, 0);

    return (
        <div className="bg-white p-8 max-w-4xl mx-auto shadow-sm border border-slate-200 print:shadow-none print:border-none relative overflow-hidden" id="printable-traveler">
            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] -rotate-45 z-0">
                <span className="text-[150px] font-black uppercase tracking-widest">{job.status}</span>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-6 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-indigo-900 text-white flex items-center justify-center rounded-lg shadow-md">
                        <Factory className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">Minerva Precision</h1>
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Production Traveler / Job Card</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex flex-col items-end">
                       <QrCode className="w-16 h-16 text-slate-800 mb-2" />
                       <div className="text-2xl font-mono font-bold tracking-widest">{job.id}</div>
                    </div>
                    <div className="text-sm font-bold text-slate-500 mt-1">Created: {new Date().toLocaleDateString()}</div>
                </div>
            </div>

            {/* Key Info Strip */}
            <div className="grid grid-cols-4 gap-4 py-6 border-b border-slate-200 relative z-10">
                <div>
                     <p className="text-xs text-slate-400 uppercase font-bold mb-1">Customer</p>
                     <p className="font-bold text-lg text-slate-800 leading-tight">{job.customer}</p>
                     <p className="text-xs text-slate-500">{job.customerType === 'CONTRACT' ? job.contractId : 'Direct Order'}</p>
                </div>
                <div>
                     <p className="text-xs text-slate-400 uppercase font-bold mb-1">Part Number</p>
                     <p className="font-bold text-lg text-slate-800 leading-tight">{job.partName}</p>
                     <p className="text-xs font-mono text-slate-500">{job.drawingNo} (Rev {job.revision})</p>
                </div>
                <div>
                     <p className="text-xs text-slate-400 uppercase font-bold mb-1">Quantity</p>
                     <p className="font-bold text-2xl text-slate-800 leading-tight">{job.qty}</p>
                     <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${job.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{job.priority} Priority</span>
                </div>
                <div>
                     <p className="text-xs text-slate-400 uppercase font-bold mb-1">Due Date</p>
                     <p className="font-bold text-lg text-slate-800 leading-tight">{job.dueDate}</p>
                     <p className="text-xs text-slate-500">{Math.ceil(totalEstTime / 60)}h {totalEstTime % 60}m Est.</p>
                </div>
            </div>

            {/* Material & Instructions */}
            <div className="grid grid-cols-3 gap-6 py-6 relative z-10">
                <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-700 text-xs uppercase mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Material Specification
                    </h3>
                    <div className="flex justify-between items-center">
                        <div>
                           <p className="font-bold text-slate-900">{material?.name || 'Material Pending'}</p>
                           <p className="font-mono text-sm text-slate-500">{material?.sku}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs text-slate-400 uppercase">Required</p>
                           <p className="font-bold text-slate-800">{job.qty} {material?.unit}</p>
                        </div>
                    </div>
                </div>
                <div className="col-span-1 bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <h3 className="font-bold text-amber-800 text-xs uppercase mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Notes
                    </h3>
                    <p className="text-sm text-amber-900 italic leading-relaxed">
                        {job.specialInstructions || "Standard operating procedures apply."}
                    </p>
                </div>
            </div>

            {/* Routing Table */}
            <div className="py-2 relative z-10">
                 <h3 className="font-bold text-slate-900 text-sm uppercase mb-4 flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                    <ListOrdered className="w-5 h-5" /> Process Routing
                 </h3>
                 <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase text-xs">
                            <th className="py-3 px-4 w-16 text-center rounded-l-lg">Seq</th>
                            <th className="py-3 px-4">Operation Description</th>
                            <th className="py-3 px-4 w-32">Work Center</th>
                            <th className="py-3 px-4 w-24 text-center">Cycle (m)</th>
                            <th className="py-3 px-4 w-40 text-center rounded-r-lg">QC / Operator Sign</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {job.operations && job.operations.length > 0 ? job.operations.sort((a,b) => a.sequence - b.sequence).map(op => (
                            <tr key={op.id}>
                                <td className="py-4 px-4 text-center font-bold text-slate-400">{op.sequence}</td>
                                <td className="py-4 px-4 font-bold text-slate-800">{op.description}</td>
                                <td className="py-4 px-4 text-slate-600 bg-slate-50 m-1 rounded">{op.workCenter}</td>
                                <td className="py-4 px-4 text-center font-mono font-medium">{op.estTime}</td>
                                <td className="py-4 px-4">
                                    <div className="h-8 border-b border-slate-200 border-dashed"></div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No operations defined.</td></tr>
                        )}
                    </tbody>
                 </table>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-400 relative z-10">
                <div>Generated by Minerva Precision MES</div>
                <div className="flex gap-8">
                    <span>Approved By: _________________</span>
                    <span>Date: _________________</span>
                </div>
            </div>
        </div>
    )
}

// Wrapper for the modal that uses the DigitalTraveler
const JobCardModal: React.FC<{ job: Job | null; isOpen: boolean; onClose: () => void }> = ({ job, isOpen, onClose }) => {
    if (!job) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Job Traveler: ${job.id}`} size="xl">
            <DigitalTraveler job={job} />
             <div className="flex justify-end gap-3 mt-8 pt-4 border-t print:hidden">
                <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Close</button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-slate-800">
                    <Printer className="w-4 h-4" /> Print Traveler
                </button>
            </div>
        </Modal>
    )
}

// --- New Job Wizard Component ---

const JobWizard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { createJob, materials, machines, showToast } = useApp();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        customerType: 'CONTRACT' as CustomerType,
        customer: '',
        contractId: '',
        contactPerson: '',
        partName: '',
        drawingNo: '',
        revision: '0',
        qty: 0,
        priority: 'MEDIUM' as 'HIGH'|'MEDIUM'|'LOW',
        dueDate: '',
        materialId: '',
        assignedMachine: '',
        specialInstructions: '',
        notifyWhatsapp: false
    });

    const [operations, setOperations] = useState<JobOperation[]>([
        { id: `op-${Date.now()}`, sequence: 10, description: 'Material Preparation', workCenter: 'Stores', estTime: 15, status: 'PENDING' }
    ]);

    // Demo Auto-fill Helper
    const demoAutoFill = () => {
        setFormData({
            customerType: 'CONTRACT',
            customer: 'SpaceX Industries',
            contractId: 'PO-SPX-8821',
            contactPerson: 'Elon M.',
            partName: 'Titanium Thrust Valve',
            drawingNo: 'TI-THR-V2',
            revision: 'B.2',
            qty: 250,
            priority: 'HIGH',
            dueDate: '2023-12-15',
            materialId: 'MAT-02',
            assignedMachine: '',
            specialInstructions: 'Critical flight component. 100% X-Ray inspection required. Handle with gloves.',
            notifyWhatsapp: true
        });
        setOperations([
            { id: '1', sequence: 10, description: 'Raw Material Cutting', workCenter: 'Wirecut', estTime: 45, status: 'PENDING' },
            { id: '2', sequence: 20, description: 'Rough Turning (OD/ID)', workCenter: 'Turning', estTime: 25, status: 'PENDING' },
            { id: '3', sequence: 30, description: '5-Axis Milling features', workCenter: 'VMC', estTime: 120, status: 'PENDING' },
            { id: '4', sequence: 40, description: 'Deburring & Polishing', workCenter: 'Grinding', estTime: 30, status: 'PENDING' },
            { id: '5', sequence: 50, description: 'Final Quality Inspection', workCenter: 'QC', estTime: 15, status: 'PENDING' },
        ]);
        showToast("✨ Demo Data Populated!", "success");
    };

    const addOperation = () => {
        const lastSeq = operations.length > 0 ? operations[operations.length - 1].sequence : 0;
        setOperations([...operations, { 
            id: `op-${Date.now()}`, 
            sequence: lastSeq + 10, 
            description: '', 
            workCenter: 'VMC', 
            estTime: 0, 
            status: 'PENDING' 
        }]);
    };

    const updateOperation = (id: string, field: keyof JobOperation, value: any) => {
        setOperations(operations.map(op => op.id === id ? { ...op, [field]: value } : op));
    };

    const removeOperation = (id: string) => {
        setOperations(operations.filter(op => op.id !== id));
    };

    const handleSubmit = () => {
        setLoading(true);
        setTimeout(() => {
            const newJob: Job = {
                id: `JOB-${Math.floor(Math.random() * 10000)}`,
                ...formData,
                status: 'PENDING',
                completedQty: 0,
                scrapQty: 0,
                assignedOperatorId: 'OP-01', // Default for demo
                currentMachineId: formData.assignedMachine,
                operations: operations,
                logs: [{ id: 'init', timestamp: new Date().toLocaleTimeString(), type: 'INFO', message: 'Job Created via Wizard', user: 'Admin' }]
            };
            createJob(newJob);
            
            if (formData.notifyWhatsapp) {
                setTimeout(() => {
                    showToast(`WhatsApp sent to Customer: "Production Started for ${newJob.partName}!"`, 'success');
                }, 1000);
            }
            
            setLoading(false);
            onClose();
        }, 1500); // Fake delay for effect
    };

    // Calculate simulated Total Time
    const totalMinutes = operations.reduce((acc, op) => acc + op.estTime, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
            {/* Top Bar */}
            <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-900 text-white px-8 py-4 flex justify-between items-center shadow-lg flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center font-bold">
                        <Plus className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">New Production Order</h2>
                        <p className="text-xs text-indigo-200 uppercase tracking-widest">Minerva Precision Wizard</p>
                    </div>
                </div>
                
                {/* Progress Steps */}
                <div className="flex items-center gap-4">
                     {[1, 2, 3].map(s => (
                         <div key={s} className={`flex items-center gap-2 ${step === s ? 'opacity-100' : 'opacity-40'}`}>
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-indigo-500 text-white shadow-lg scale-110' : 'bg-slate-700 text-slate-400'}`}>
                                {step > s ? <Check className="w-5 h-5" /> : s}
                             </div>
                             <span className="text-sm font-medium hidden md:block">
                                 {s === 1 ? 'Order Details' : s === 2 ? 'Process Routing' : 'Review & Launch'}
                             </span>
                             {s < 3 && <div className="w-8 h-0.5 bg-slate-700 mx-2"></div>}
                         </div>
                     ))}
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={demoAutoFill} className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-purple-900/50 transition-all active:scale-95">
                        <Zap className="w-4 h-4 fill-current" /> Auto-Fill Demo
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                </div>
            </div>

            {/* Main Content Area - Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT PANEL: INPUTS */}
                <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-200 bg-slate-50">
                    
                    {step === 1 && (
                        <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
                            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <User className="w-6 h-6 text-indigo-600" /> Customer & Part Information
                            </h3>
                            
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Customer Type</label>
                                        <select 
                                            className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                            value={formData.customerType} 
                                            onChange={e => setFormData({...formData, customerType: e.target.value as CustomerType})}
                                        >
                                            <option value="CONTRACT">Contract / B2B</option>
                                            <option value="INDIVIDUAL">Individual / Retail</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Customer Name</label>
                                        <input className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} placeholder="e.g. Acme Corp" />
                                    </div>
                                    {formData.customerType === 'CONTRACT' ? (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Contract / PO Ref</label>
                                            <input className="w-full border border-slate-300 p-2.5 rounded-lg font-mono text-sm" value={formData.contractId} onChange={e => setFormData({...formData, contractId: e.target.value})} placeholder="PO-XXXX-XXXX" />
                                        </div>
                                    ) : (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Contact Person</label>
                                            <input className="w-full border border-slate-300 p-2.5 rounded-lg" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Part Name / Description</label>
                                        <input className="w-full border border-slate-300 p-2.5 rounded-lg font-medium" value={formData.partName} onChange={e => setFormData({...formData, partName: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Drawing No.</label>
                                        <input className="w-full border border-slate-300 p-2.5 rounded-lg font-mono text-sm" value={formData.drawingNo} onChange={e => setFormData({...formData, drawingNo: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Revision</label>
                                        <input className="w-full border border-slate-300 p-2.5 rounded-lg" value={formData.revision} onChange={e => setFormData({...formData, revision: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Quantity</label>
                                        <input type="number" className="w-full border border-slate-300 p-2.5 rounded-lg font-bold text-lg text-center" value={formData.qty} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Priority</label>
                                        <select className="w-full border border-slate-300 p-2.5 rounded-lg" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Due Date</label>
                                        <input type="date" className="w-full border border-slate-300 p-2.5 rounded-lg" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                         <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
                             <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <ListOrdered className="w-6 h-6 text-indigo-600" /> Process Engineering
                            </h3>

                            {/* Resources */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Raw Material</label>
                                        <select className="w-full border border-slate-300 p-2.5 rounded-lg" value={formData.materialId} onChange={e => setFormData({...formData, materialId: e.target.value})}>
                                            <option value="">Select Material from Inventory...</option>
                                            {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.stock} {m.unit})</option>)}
                                        </select>
                                     </div>
                                     <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Special Instructions</label>
                                        <input className="w-full border border-slate-300 p-2.5 rounded-lg" value={formData.specialInstructions} onChange={e => setFormData({...formData, specialInstructions: e.target.value})} placeholder="Notes for operator..." />
                                     </div>
                                </div>
                            </div>

                            {/* Operations Builder */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-600 uppercase text-sm tracking-wide">Routing Steps</h4>
                                    <button onClick={addOperation} className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold hover:bg-indigo-200 transition">+ Add Operation</button>
                                </div>
                                
                                <div className="space-y-3">
                                    {operations.map((op, index) => (
                                        <div key={op.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 group hover:border-indigo-400 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                {op.sequence}
                                            </div>
                                            <div className="flex-1">
                                                <input 
                                                    className="w-full font-medium text-slate-800 outline-none border-b border-transparent focus:border-indigo-300 placeholder-slate-300 transition-colors"
                                                    placeholder="Describe Operation..."
                                                    value={op.description}
                                                    onChange={e => updateOperation(op.id, 'description', e.target.value)}
                                                    autoFocus={index === operations.length - 1}
                                                />
                                            </div>
                                            <select 
                                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-medium"
                                                value={op.workCenter}
                                                onChange={e => updateOperation(op.id, 'workCenter', e.target.value)}
                                            >
                                                <option value="VMC">VMC</option>
                                                <option value="Turning">Turning</option>
                                                <option value="Grinding">Grinding</option>
                                                <option value="Wirecut">Wirecut</option>
                                                <option value="QC">QC Station</option>
                                                <option value="Stores">Stores</option>
                                            </select>
                                            <div className="flex items-center gap-1 w-20">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <input 
                                                    type="number" 
                                                    className="w-full text-sm outline-none text-right font-mono"
                                                    value={op.estTime}
                                                    onChange={e => updateOperation(op.id, 'estTime', Number(e.target.value))}
                                                />
                                                <span className="text-xs text-slate-400">min</span>
                                            </div>
                                            {operations.length > 1 && (
                                                <button onClick={() => removeOperation(op.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-lg flex justify-between items-center text-indigo-900 font-medium">
                                    <span>Total Estimated Cycle Time</span>
                                    <span className="font-bold text-xl">{totalMinutes} <span className="text-sm font-normal opacity-70">mins</span></span>
                                </div>
                            </div>
                         </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col h-full animate-fade-in justify-center items-center">
                            <div className="text-center space-y-4 mb-8">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileCheck className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900">Ready to Launch</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    Please review the generated Job Card on the right. If everything looks correct, release the job to the production floor.
                                </p>
                            </div>
                            
                            <div className="space-y-4 w-full max-w-md">
                                <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                                    <input 
                                        type="checkbox" 
                                        id="notify-final"
                                        checked={formData.notifyWhatsapp}
                                        onChange={e => setFormData({...formData, notifyWhatsapp: e.target.checked})}
                                        className="w-5 h-5 text-green-600 rounded"
                                    />
                                    <label htmlFor="notify-final" className="flex-1 font-medium text-slate-700 cursor-pointer">
                                        Send WhatsApp Notification to Customer
                                    </label>
                                    <MessageCircle className="w-5 h-5 text-green-500" />
                                </div>
                                
                                <button onClick={handleSubmit} disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {loading ? (
                                        <>Creating Job...</>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" /> Release Job to Floor
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL: LIVE PREVIEW */}
                <div className="w-1/2 bg-slate-200 p-8 overflow-y-auto relative bg-grid-pattern">
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest z-10 border border-slate-200">
                        Live Preview
                    </div>
                    {/* Render the Digital Traveler component with current form data */}
                    <div className="transform scale-[0.85] origin-top">
                        <DigitalTraveler job={{
                            id: 'DRAFT-PREVIEW',
                            ...formData,
                            status: 'PENDING',
                            completedQty: 0,
                            scrapQty: 0,
                            logs: [],
                            operations: operations
                        } as any} />
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center flex-shrink-0">
                <button 
                    disabled={step === 1}
                    onClick={() => setStep(step - 1)}
                    className="text-slate-500 font-bold px-6 py-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition"
                >
                    Back
                </button>
                {step < 3 && (
                    <button 
                        onClick={() => setStep(step + 1)}
                        className="bg-slate-900 text-white font-bold px-8 py-3 rounded-lg hover:bg-slate-800 shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                        Next Step <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Operator View ---

const OperatorView = () => {
  const { user, jobs, updateJobStatus, showToast, logout } = useApp();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeQty, setCompleteQty] = useState(0);
  const [scrapQty, setScrapQty] = useState(0);
  const [showJobCard, setShowJobCard] = useState(false);

  const myJobs = jobs.filter(j => j.assignedOperatorId === user?.id);
  const activeJob = myJobs.find(j => j.status === 'RUNNING');

  useEffect(() => {
    if (activeJob) setSelectedJob(activeJob);
  }, [activeJob]);

  const handleStart = (job: Job) => {
    if (activeJob && activeJob.id !== job.id) {
      showToast("Pause current job before starting new one", "error");
      return;
    }
    updateJobStatus(job.id, 'RUNNING', 'Operator started job');
    setSelectedJob(job);
    showToast("Job Started Successfully", "success");
  };

  const handlePause = () => {
    if (!selectedJob) return;
    updateJobStatus(selectedJob.id, 'PAUSED', `Paused: ${pauseReason}`);
    setShowPauseModal(false);
    setPauseReason('');
    showToast("Job Paused", "info");
  };

  const handleComplete = () => {
    if (!selectedJob) return;
    updateJobStatus(selectedJob.id, 'QC_PENDING', `Production reported. Qty: ${completeQty}, Scrap: ${scrapQty}`, {
      completedQty: (selectedJob.completedQty || 0) + Number(completeQty),
      scrapQty: (selectedJob.scrapQty || 0) + Number(scrapQty)
    });
    
    setShowCompleteModal(false);
    setSelectedJob(null);
    showToast("Job Submitted for QC Inspection", "success");
  };

  const handleRequestMaterial = () => {
      showToast("Material Request Sent to Store", "success");
  }

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <header className="bg-white px-4 py-3 shadow flex justify-between items-center sticky top-0 z-10 border-b border-indigo-100">
        <div className="flex items-center gap-2">
           <img src={user?.avatar} alt="avatar" className="w-10 h-10 rounded-full border-2 border-slate-200" />
           <div>
             <h1 className="font-bold text-slate-800 leading-tight">{user?.name}</h1>
             <p className="text-xs text-slate-500 font-medium">Minerva Operator • Shift A</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
             <button onClick={handleRequestMaterial} className="bg-indigo-50 text-indigo-600 p-2 rounded-full hover:bg-indigo-100 transition-colors">
                <Package className="w-5 h-5" />
             </button>
             <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </div>
             <button onClick={logout} className="bg-red-50 text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors ml-2" title="Logout">
                <LogOut className="w-5 h-5" />
             </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedJob ? (
          <div className="space-y-4">
            {selectedJob.status === 'RUNNING' && (
               <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg animate-pulse-slow">
                 <div className="flex justify-between items-center">
                   <span className="font-bold flex items-center gap-2"><Play className="fill-current w-4 h-4" /> PRODUCTION ACTIVE</span>
                   <span className="text-sm opacity-90 font-mono">Running</span>
                 </div>
               </div>
            )}

            <Card className="border-l-4 border-l-indigo-500 overflow-hidden">
               <div className="flex justify-between items-start mb-4">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedJob.partName}</h2>
                    <p className="text-lg text-slate-600">{selectedJob.customer}</p>
                 </div>
                 <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-slate-800">{selectedJob.completedQty} <span className="text-base text-slate-400 font-normal">/ {selectedJob.qty}</span></div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Produced</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wide mb-1">Drawing No</span>
                    <span className="font-semibold text-slate-800 text-lg">{selectedJob.drawingNo}</span>
                    <span className="text-xs text-slate-500 ml-1">({selectedJob.revision})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wide mb-1">Machine</span>
                    <span className="font-semibold text-slate-800 text-lg">{selectedJob.currentMachineId}</span>
                  </div>
               </div>

               {/* Drawing Preview Area */}
               <div onClick={() => setShowJobCard(true)} className="bg-slate-800 h-48 rounded-xl flex flex-col items-center justify-center mb-6 text-slate-400 gap-3 border border-slate-700 shadow-inner relative overflow-hidden group cursor-pointer hover:bg-slate-700 transition-colors">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581093588402-4296d112d992?auto=format&fit=crop&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
                  <ClipboardList className="w-12 h-12 opacity-50 relative z-10" />
                  <span className="text-sm font-medium relative z-10 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm group-hover:bg-blue-600 transition-colors">Tap to view Job Card & Routing</span>
               </div>

               {/* BIG ACTION BUTTONS */}
               <div className="grid grid-cols-2 gap-4">
                  {selectedJob.status === 'RUNNING' ? (
                    <>
                       <button onClick={() => setShowPauseModal(true)} className="col-span-1 bg-amber-500 hover:bg-amber-600 text-white h-32 rounded-xl font-bold text-xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform border-b-4 border-amber-700">
                          <Pause className="w-10 h-10 fill-current" />
                          PAUSE
                       </button>
                       <button onClick={() => setShowCompleteModal(true)} className="col-span-1 bg-green-600 hover:bg-green-700 text-white h-32 rounded-xl font-bold text-xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform border-b-4 border-green-800">
                          <CheckCircle className="w-10 h-10" />
                          FINISH
                       </button>
                    </>
                  ) : selectedJob.status === 'PAUSED' || selectedJob.status === 'PENDING' ? (
                     <button onClick={() => handleStart(selectedJob)} className="col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-32 rounded-xl font-bold text-2xl flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform border-b-4 border-indigo-800">
                        <Play className="w-12 h-12 fill-current" />
                        {selectedJob.status === 'PAUSED' ? 'RESUME JOB' : 'START JOB'}
                     </button>
                  ) : null}
               </div>
               {selectedJob.status !== 'RUNNING' && (
                  <button onClick={() => setSelectedJob(null)} className="w-full mt-4 py-3 text-slate-500 hover:text-slate-800 font-medium">
                    ← Back to Job List
                  </button>
               )}
            </Card>
          </div>
        ) : (
          /* Job List */
          <div className="space-y-4">
             <div className="flex justify-between items-end">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Assigned to Me</h2>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{myJobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'QC_PENDING').length} Active</span>
             </div>
             
             {myJobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'QC_PENDING').length === 0 && (
               <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                 <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
                 <p>All caught up! No pending jobs.</p>
               </div>
             )}

             {myJobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'QC_PENDING').map(job => (
                <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 active:bg-blue-50 transition-all cursor-pointer relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 group-hover:w-2 transition-all"></div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                     <div className="font-bold text-lg text-slate-800">{job.partName}</div>
                     <StatusBadge status={job.status} />
                  </div>
                  <div className="text-slate-600 mb-3 pl-2 text-sm">{job.customer} • <span className="font-mono">{job.drawingNo}</span></div>
                  <div className="flex justify-between items-center text-sm pl-2">
                    <div className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium border border-slate-200">Qty: {job.qty}</div>
                    <div className={`font-bold flex items-center gap-1 ${job.priority === 'HIGH' ? 'text-red-600' : 'text-slate-500'}`}>
                      {job.priority === 'HIGH' && <AlertCircle className="w-4 h-4" />}
                      {job.priority} PRIORITY
                    </div>
                  </div>
                </div>
             ))}
          </div>
        )}
      </main>

      {/* Operator Modals */}
      <Modal isOpen={showPauseModal} onClose={() => setShowPauseModal(false)} title="Select Pause Reason">
         <div className="grid grid-cols-2 gap-3 mb-4">
            {['Tool Breakage', 'Material Shortage', 'Machine Issue', 'Lunch/Tea', 'Drawing Doubt', 'Shift End'].map(reason => (
              <button 
                key={reason}
                onClick={() => setPauseReason(reason)}
                className={`p-4 rounded-xl border text-sm font-medium transition-all ${pauseReason === reason ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
              >
                {reason}
              </button>
            ))}
         </div>
         <button disabled={!pauseReason} onClick={handlePause} className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold disabled:opacity-50 hover:bg-amber-600 transition-colors">
           Confirm Pause
         </button>
      </Modal>

      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Report Production">
         <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
               <p className="text-sm text-blue-800 mb-1">Target Quantity</p>
               <p className="text-2xl font-bold text-blue-900">{selectedJob ? selectedJob.qty - (selectedJob.completedQty || 0) : 0} pcs remaining</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Good Qty</label>
                <input type="number" value={completeQty} onChange={(e) => setCompleteQty(Number(e.target.value))} className="w-full text-4xl font-bold p-4 border border-slate-300 rounded-xl text-center focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Scrap Qty</label>
                <input type="number" value={scrapQty} onChange={(e) => setScrapQty(Number(e.target.value))} className="w-full text-4xl font-bold p-4 border border-red-200 bg-red-50 rounded-xl text-center text-red-700 focus:ring-2 focus:ring-red-500 outline-none" />
                </div>
            </div>
            <button onClick={handleComplete} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg mt-2 shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6" /> Submit for QC
            </button>
         </div>
      </Modal>

      <JobCardModal job={selectedJob} isOpen={showJobCard} onClose={() => setShowJobCard(false)} />
    </div>
  );
};

// --- Admin / Planner View Components ---

const SidebarItem: React.FC<{ icon: any; label: string; active?: boolean; onClick: () => void; badge?: number }> = ({ icon: Icon, label, active, onClick, badge }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-200 group relative ${active ? 'text-white shadow-lg bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-500"></div>}
    <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${active ? 'text-indigo-300' : 'text-slate-500 group-hover:text-white'}`} />
        {label}
    </div>
    {badge ? <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">{badge}</span> : null}
  </button>
);

const JobActionModal: React.FC<{ job: Job | null; isOpen: boolean; onClose: () => void; type: 'HOLD' | 'TRANSFER' | 'RECALL' | null }> = ({ job, isOpen, onClose, type }) => {
  const { updateJobStatus, showToast } = useApp();
  const [reason, setReason] = useState('');
  
  if (!job || !type) return null;

  const handleSubmit = () => {
    if (type === 'HOLD') updateJobStatus(job.id, 'HOLD', reason);
    if (type === 'RECALL') updateJobStatus(job.id, 'PENDING', `Recalled: ${reason}`);
    if (type === 'TRANSFER') updateJobStatus(job.id, job.status, `Transferred: ${reason}`); 
    showToast(`Job ${type} Action Successful`, "success");
    onClose();
    setReason('');
  };

  const titles = { HOLD: 'Hold Job', TRANSFER: 'Transfer Machine', RECALL: 'Recall Job' };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${titles[type]} - ${job.partName}`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Current Status: <StatusBadge status={job.status} /></p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{type === 'TRANSFER' ? 'Target Machine & Reason' : 'Reason / Remarks'}</label>
          <textarea className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter details..." />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Confirm {type}</button>
        </div>
      </div>
    </Modal>
  );
};

const MaterialMovementModal: React.FC<{ isOpen: boolean; onClose: () => void; type: 'INWARD' | 'OUTWARD' }> = ({ isOpen, onClose, type }) => {
    const { materials, updateMaterialStock } = useApp();
    const [data, setData] = useState({ materialId: '', qty: 0, ref: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMaterialStock(data.materialId, data.qty, type, data.ref);
        onClose();
        setData({ materialId: '', qty: 0, ref: '' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={type === 'INWARD' ? 'Material Inward (GRN)' : 'Material Outward (Issue)'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Material</label>
                    <select required className="w-full border p-2 rounded" value={data.materialId} onChange={e => setData({...data, materialId: e.target.value})}>
                        <option value="">Select Material...</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} (Cur: {m.stock})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input type="number" required className="w-full border p-2 rounded" value={data.qty} onChange={e => setData({...data, qty: Number(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{type === 'INWARD' ? 'PO Number / Supplier Invoice' : 'Job Card / Department'}</label>
                    <input required className="w-full border p-2 rounded" value={data.ref} onChange={e => setData({...data, ref: e.target.value})} placeholder={type === 'INWARD' ? "e.g. PO-2921" : "e.g. JOB-101"} />
                </div>
                <button type="submit" className={`w-full py-3 rounded-lg font-bold text-white ${type === 'INWARD' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                    Confirm {type === 'INWARD' ? 'Inward' : 'Issue'}
                </button>
            </form>
        </Modal>
    );
};

const ReportsView = () => {
    const { jobs, materials, materialTransactions, machines } = useApp();
    const [activeTab, setActiveTab] = useState<'PRODUCTION' | 'QUALITY' | 'INVENTORY' | 'MACHINES'>('PRODUCTION');

    // Stats calculations
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
    const totalRejected = jobs.reduce((acc, j) => acc + (j.rejectedQty || 0), 0) + jobs.reduce((acc, j) => acc + j.scrapQty, 0);
    const totalProduced = jobs.reduce((acc, j) => acc + (j.completedQty || 0), 0);
    const rejectRate = totalProduced > 0 ? ((totalRejected / totalProduced) * 100).toFixed(1) : 0;

    // Consumption logic
    const consumptionData = materials.map(mat => {
      const consumed = materialTransactions
        .filter(t => t.materialId === mat.id && t.type === 'OUTWARD')
        .reduce((acc, t) => acc + t.qty, 0);
      const inward = materialTransactions
        .filter(t => t.materialId === mat.id && t.type === 'INWARD')
        .reduce((acc, t) => acc + t.qty, 0);
      return { material: mat, consumed, inward };
    });

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Analytics & Reports</h1>
                <div className="bg-white p-1 rounded-lg border border-slate-200 flex shadow-sm">
                   {['PRODUCTION', 'QUALITY', 'INVENTORY', 'MACHINES'].map((tab) => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                      >
                        {tab}
                      </button>
                   ))}
                </div>
            </div>

            {activeTab === 'PRODUCTION' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-5 border-l-4 border-l-blue-500">
                        <p className="text-sm text-slate-500 font-medium mb-1">OEE Score</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-bold text-slate-800">87.5%</h2>
                            <span className="text-xs text-green-600 font-bold">↑ 2.4%</span>
                        </div>
                    </Card>
                    <Card className="p-5 border-l-4 border-l-green-500">
                        <p className="text-sm text-slate-500 font-medium mb-1">Total Production</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-bold text-slate-800">{totalProduced}</h2>
                            <span className="text-xs text-slate-400">parts</span>
                        </div>
                    </Card>
                    <Card className="p-5 border-l-4 border-l-purple-500">
                        <p className="text-sm text-slate-500 font-medium mb-1">Active Jobs</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-bold text-slate-800">{jobs.filter(j => j.status === 'RUNNING').length}</h2>
                        </div>
                    </Card>
                </div>
                <Card title="Daily Production vs Target">
                    <div className="h-64 flex items-end justify-between gap-4 pt-4">
                        {[65, 80, 45, 90, 75, 55, 85].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-indigo-50 rounded-t-sm h-full relative overflow-hidden">
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-purple-500 transition-all duration-500 group-hover:to-pink-500" style={{height: `${h}%`}}></div>
                                </div>
                                <span className="text-xs text-slate-500 font-medium">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                            </div>
                        ))}
                    </div>
                </Card>
              </>
            )}

            {activeTab === 'QUALITY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Card className="p-6">
                         <h3 className="text-lg font-bold text-slate-800 mb-4">Overall Quality Yield</h3>
                         <div className="flex items-center justify-center py-8">
                             <div className="w-48 h-48 rounded-full border-8 border-slate-100 relative flex items-center justify-center">
                                 <div className="text-center">
                                    <span className="text-4xl font-bold text-slate-800">{100 - Number(rejectRate)}%</span>
                                    <p className="text-xs text-slate-500 uppercase">Passed</p>
                                 </div>
                                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                                     <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="8" className="text-green-500" strokeDasharray={`${(100 - Number(rejectRate)) * 5.5} 1000`} />
                                 </svg>
                             </div>
                         </div>
                         <div className="flex justify-center gap-8 text-sm">
                             <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-slate-600">Good: {totalProduced - totalRejected}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-slate-600">Rejected: {totalRejected}</span>
                             </div>
                         </div>
                     </Card>

                     <Card title="Scrap Reason Analysis">
                        <div className="space-y-4 pt-4">
                            {[
                                { label: 'Dimensional Deviation', val: 45, color: 'bg-orange-500' },
                                { label: 'Material Defect', val: 25, color: 'bg-red-500' },
                                { label: 'Tool Breakage', val: 20, color: 'bg-yellow-500' },
                                { label: 'Operator Error', val: 10, color: 'bg-blue-500' }
                            ].map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">{item.label}</span>
                                        <span className="text-slate-500">{item.val}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className={`${item.color} h-2 rounded-full`} style={{width: `${item.val}%`}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'INVENTORY' && (
                <Card title="Material Consumption Report">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Material Name</th>
                                    <th className="px-6 py-3 font-semibold">SKU</th>
                                    <th className="px-6 py-3 font-semibold">Unit</th>
                                    <th className="px-6 py-3 font-semibold text-green-600">Total Inward</th>
                                    <th className="px-6 py-3 font-semibold text-orange-600">Total Consumed</th>
                                    <th className="px-6 py-3 font-semibold">Current Stock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {consumptionData.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-800">{d.material.name}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{d.material.sku}</td>
                                        <td className="px-6 py-4 text-slate-500">{d.material.unit}</td>
                                        <td className="px-6 py-4 font-bold text-green-700">+{d.inward}</td>
                                        <td className="px-6 py-4 font-bold text-orange-600">-{d.consumed}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800">{d.material.stock}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'MACHINES' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {machines.map(m => (
                            <Card key={m.id} className="p-4 border-t-4 border-t-indigo-500">
                                <h3 className="font-bold text-slate-800">{m.name}</h3>
                                <p className="text-xs text-slate-500 mb-3">{m.type}</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Utilization</span>
                                        <span className="font-bold">{Math.round((m.totalRunHours / 2000) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-indigo-600 h-2 rounded-full" style={{width: `${(m.totalRunHours / 2000) * 100}%`}}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span>{m.totalRunHours} hrs run</span>
                                        <span>2000 hrs cap</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    
                    <Card title="Detailed Maintenance History">
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b">
                                    <tr>
                                        <th className="px-6 py-3">Machine</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Technician</th>
                                        <th className="px-6 py-3">Task</th>
                                        <th className="px-6 py-3">Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1,2,3].map(i => (
                                        <tr key={i} className="border-b border-slate-50">
                                            <td className="px-6 py-3 font-medium">VMC-Haas-VF2</td>
                                            <td className="px-6 py-3 text-slate-500">2023-10-{10+i}</td>
                                            <td className="px-6 py-3">Service Team A</td>
                                            <td className="px-6 py-3">Monthly Calibration</td>
                                            <td className="px-6 py-3"><span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">PREVENTIVE</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

const UserManagementView = () => {
  const { users, createUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: 'OPERATOR' as Role, avatar: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
       id: `USR-${Date.now()}`,
       name: formData.name,
       role: formData.role,
       avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
    };
    createUser(newUser);
    setShowModal(false);
    setFormData({ name: '', role: 'OPERATOR', avatar: '' });
  };

  return (
     <div className="p-8 space-y-8 animate-fade-in">
         <div className="flex justify-between items-center">
             <div>
                <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                <p className="text-slate-500">Manage access and roles for the system.</p>
             </div>
             <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md">
                <Plus className="w-5 h-5" /> Add User
             </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {users.map(u => (
                 <div key={u.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                     <img src={u.avatar} className="w-16 h-16 rounded-full border-2 border-slate-100" />
                     <div>
                         <h3 className="font-bold text-lg text-slate-800">{u.name}</h3>
                         <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'OPERATOR' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                             {u.role}
                         </span>
                         <p className="text-xs text-slate-400 font-mono mt-1">{u.id}</p>
                     </div>
                 </div>
             ))}
         </div>

         <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New User" size="sm">
             <form onSubmit={handleCreate} className="space-y-4">
                 <div>
                     <label className="block text-sm font-medium mb-1">Full Name</label>
                     <input required className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Smith" />
                 </div>
                 <div>
                     <label className="block text-sm font-medium mb-1">Role</label>
                     <select className="w-full border p-2 rounded" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                         <option value="OPERATOR">Operator</option>
                         <option value="PLANNER">Planner</option>
                         <option value="ADMIN">Admin</option>
                         <option value="QUALITY">Quality Inspector</option>
                     </select>
                 </div>
                 <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 mt-4">
                     Create User
                 </button>
             </form>
         </Modal>
     </div>
  );
};

const QCView = () => {
    const { jobs, updateJobStatus, showToast } = useApp();
    const pendingQC = jobs.filter(j => j.status === 'QC_PENDING');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [approveQty, setApproveQty] = useState(0);

    const handleQCAction = (approved: boolean) => {
        if(!selectedJob) return;
        if(approved) {
            updateJobStatus(selectedJob.id, 'COMPLETED', `QC Approved. Good: ${approveQty}`, {
                completedQty: (selectedJob.completedQty || 0) // Already updated by operator, QC just validates
            });
            showToast("Job Approved & Closed", "success");
        } else {
            updateJobStatus(selectedJob.id, 'HOLD', "QC Rejected - Rework Required");
            showToast("Job Rejected - Sent to Hold", "error");
        }
        setSelectedJob(null);
    };

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" /> Quality Control Queue
            </h1>
            
            {pendingQC.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">All Clear!</h3>
                    <p className="text-slate-500">No jobs pending inspection.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingQC.map(job => (
                        <Card key={job.id} className="relative overflow-hidden border-t-4 border-t-orange-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{job.partName}</h3>
                                    <p className="text-sm text-slate-500">{job.id}</p>
                                </div>
                                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase">Pending QC</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Operator</span>
                                    <span className="font-medium">{job.assignedOperatorId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Reported Qty</span>
                                    <span className="font-bold text-blue-600">{job.completedQty}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Scrap</span>
                                    <span className="font-bold text-red-600">{job.scrapQty}</span>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedJob(job); setApproveQty(job.completedQty); }} className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800">
                                Inspect & Approve
                            </button>
                        </Card>
                    ))}
                </div>
            )}

            {selectedJob && (
                <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title="QC Inspection Form">
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Job Details</p>
                            <p className="font-bold text-lg">{selectedJob.partName}</p>
                            <p>Drawing: {selectedJob.drawingNo}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Verify Quantity</label>
                            <input type="number" value={approveQty} onChange={(e) => setApproveQty(Number(e.target.value))} className="w-full border p-2 rounded" />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => handleQCAction(false)} className="flex-1 bg-red-100 text-red-700 py-3 rounded-lg font-bold hover:bg-red-200">Reject</button>
                            <button onClick={() => handleQCAction(true)} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Approve</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const MaterialsView = () => {
    const { materials, materialTransactions, showToast } = useApp();
    const [moveType, setMoveType] = useState<'INWARD' | 'OUTWARD' | null>(null);

    return (
        <div className="p-8 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
                    <p className="text-slate-500">Real-time stock levels & material movement</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setMoveType('INWARD')} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow hover:bg-green-700 transition">
                        <ArrowDownCircle className="w-4 h-4" /> Inward (GRN)
                    </button>
                    <button onClick={() => setMoveType('OUTWARD')} className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow hover:bg-orange-600 transition">
                        <ArrowUpCircle className="w-4 h-4" /> Issue Material
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b bg-slate-50 font-bold text-slate-700">Stock Levels</div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-500 border-b">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Material</th>
                                <th className="px-6 py-3 font-semibold">SKU</th>
                                <th className="px-6 py-3 font-semibold">Stock</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {materials.map(mat => (
                                <tr key={mat.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-800">{mat.name}</td>
                                    <td className="px-6 py-4 font-mono text-slate-500">{mat.sku}</td>
                                    <td className="px-6 py-4 text-slate-800 font-bold">{mat.stock} <span className="text-xs font-normal text-slate-400">{mat.unit}</span></td>
                                    <td className="px-6 py-4"><StatusBadge status={mat.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[500px]">
                     <div className="px-6 py-4 border-b bg-slate-50 font-bold text-slate-700 flex justify-between items-center">
                        Recent Transactions
                        <History className="w-4 h-4 text-slate-400" />
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {materialTransactions.slice().reverse().map(trx => (
                            <div key={trx.id} className="flex gap-3 text-sm border-b border-slate-100 pb-3 last:border-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${trx.type === 'INWARD' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {trx.type === 'INWARD' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{trx.materialId}</p>
                                    <p className="text-xs text-slate-500">{trx.date} • Ref: {trx.reference}</p>
                                </div>
                                <div className="ml-auto font-mono font-bold">
                                    {trx.type === 'INWARD' ? '+' : '-'}{trx.qty}
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

            <MaterialMovementModal isOpen={!!moveType} onClose={() => setMoveType(null)} type={moveType || 'INWARD'} />
        </div>
    );
};

const MaintenanceView = () => {
    const { machines, maintenanceLogs, scheduleMaintenance } = useApp();
    const [selectedMachine, setSelectedMachine] = useState<string>('');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [newLog, setNewLog] = useState({ type: 'PREVENTIVE', description: '', date: '' });

    const handleSchedule = () => {
        scheduleMaintenance({
            id: `MT-${Date.now()}`,
            machineId: selectedMachine,
            type: newLog.type as any,
            description: newLog.description,
            date: newLog.date,
            technician: 'Internal',
            status: 'SCHEDULED'
        });
        setShowScheduleModal(false);
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Machine Maintenance</h1>
                    <p className="text-slate-500">Preventive schedules & breakdown tracking</p>
                </div>
                <button onClick={() => setShowScheduleModal(true)} disabled={!selectedMachine} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50">
                    <Calendar className="w-4 h-4" /> Schedule Task
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {machines.map(m => (
                    <div 
                        key={m.id} 
                        onClick={() => setSelectedMachine(m.id)}
                        className={`bg-white p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedMachine === m.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-transparent hover:border-slate-200'} shadow-sm`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <Cpu className={`w-8 h-8 ${m.status === 'RUNNING' ? 'text-green-500' : m.status === 'MAINTENANCE' ? 'text-red-500' : 'text-slate-400'}`} />
                            <StatusBadge status={m.status} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">{m.name}</h3>
                        <p className="text-xs text-slate-500 mb-4">{m.type}</p>
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Run Hours</span>
                                <span className="font-mono">{m.totalRunHours}h</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Last Service</span>
                                <span className="text-slate-700 font-medium">{m.lastMaintenance}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Next Due</span>
                                <span className={`font-bold ${new Date(m.nextMaintenance) < new Date() ? 'text-red-600' : 'text-green-600'}`}>{m.nextMaintenance}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b bg-slate-50 font-bold text-slate-700">Maintenance Log</div>
                <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 border-b">
                        <tr>
                            <th className="px-6 py-3">Machine</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {maintenanceLogs.filter(l => !selectedMachine || l.machineId === selectedMachine).map(log => (
                            <tr key={log.id}>
                                <td className="px-6 py-4 font-medium">{log.machineId}</td>
                                <td className="px-6 py-4"><span className={`text-xs font-bold px-2 py-0.5 rounded ${log.type === 'BREAKDOWN' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{log.type}</span></td>
                                <td className="px-6 py-4">{log.description}</td>
                                <td className="px-6 py-4">{log.date}</td>
                                <td className="px-6 py-4"><StatusBadge status={log.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule Maintenance">
                <div className="space-y-4">
                     <p className="text-sm text-slate-600">Machine: <span className="font-bold">{selectedMachine}</span></p>
                     <div>
                         <label className="block text-sm font-medium mb-1">Type</label>
                         <select className="w-full border p-2 rounded" value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value})}>
                             <option value="PREVENTIVE">Preventive Maintenance</option>
                             <option value="BREAKDOWN">Breakdown Repair</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1">Description</label>
                         <input className="w-full border p-2 rounded" value={newLog.description} onChange={e => setNewLog({...newLog, description: e.target.value})} placeholder="e.g. Oil Change" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1">Date</label>
                         <input type="date" className="w-full border p-2 rounded" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} />
                     </div>
                     <button onClick={handleSchedule} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Schedule</button>
                </div>
            </Modal>
        </div>
    );
};

const PlannerDashboard = () => {
  const { jobs, machines } = useApp();
  
  const stats = [
    { label: 'Total Jobs', value: jobs.length, icon: ClipboardList, from: 'from-blue-500', to: 'to-blue-600' },
    { label: 'Running', value: jobs.filter(j => j.status === 'RUNNING').length, icon: Play, from: 'from-green-500', to: 'to-emerald-600' },
    { label: 'Pending QC', value: jobs.filter(j => j.status === 'QC_PENDING').length, icon: CheckCircle, from: 'from-orange-500', to: 'to-amber-500' },
    { label: 'Machines Active', value: machines.filter(m => m.status === 'RUNNING').length + '/' + machines.length, icon: Cpu, from: 'from-purple-500', to: 'to-indigo-600' },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {stats.map((s, i) => (
           <Card key={i} className="flex items-center gap-4 p-5 hover:shadow-lg transition-all cursor-default group border-t-4 border-t-transparent hover:border-t-indigo-500">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${s.from} ${s.to} group-hover:scale-110 transition-transform duration-300`}>
                <s.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-3xl font-extrabold text-slate-800">{s.value}</p>
              </div>
           </Card>
         ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card title="Live Machine Status" className="col-span-2 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
               {machines.map(m => (
                 <div key={m.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                       <div className="relative">
                          <div className={`w-4 h-4 rounded-full ${m.status === 'RUNNING' ? 'bg-green-500 animate-pulse' : m.status === 'DOWN' ? 'bg-red-500' : m.status === 'MAINTENANCE' ? 'bg-red-400' : 'bg-amber-300'}`} />
                          {m.status === 'RUNNING' && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25"></div>}
                       </div>
                       <div>
                         <p className="font-bold text-slate-800">{m.name}</p>
                         <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{m.type}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-700">Eff: {m.efficiency}%</span>
                         </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <StatusBadge status={m.status} />
                       {m.currentJobId && <p className="text-xs font-mono text-indigo-600 mt-1 font-medium">{m.currentJobId}</p>}
                    </div>
                 </div>
               ))}
            </div>
         </Card>

         <Card title="Recent Activity" className="h-full">
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
               {jobs.flatMap(j => j.logs).sort((a,b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8).map(log => (
                 <div key={log.id} className="flex gap-4 relative">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white"></div>
                        <div className="w-0.5 h-full bg-slate-100 my-1"></div>
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-mono text-slate-400 mb-0.5">{log.timestamp}</p>
                      <p className="text-sm text-slate-800 font-medium">
                          <span className={`font-bold ${log.type === 'QC_APPROVE' ? 'text-green-600' : log.type === 'START' ? 'text-indigo-600' : 'text-slate-600'}`}>
                             {log.type.replace('_',' ')}
                          </span> 
                          : {log.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">by {log.user}</p>
                    </div>
                 </div>
               ))}
            </div>
         </Card>
       </div>
    </div>
  );
};

const PlannerJobs = () => {
  const { jobs } = useApp();
  const [filter, setFilter] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showJobCard, setShowJobCard] = useState(false);
  const [actionType, setActionType] = useState<'HOLD' | 'TRANSFER' | 'RECALL' | null>(null);

  const filteredJobs = filter === 'ALL' ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in">
       <div className="flex justify-between items-center mb-8">
         <h1 className="text-2xl font-bold text-slate-800">Job Management</h1>
         <button onClick={() => setShowWizard(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md font-medium transition-all active:scale-95">
            <Plus className="w-5 h-5" /> New Job Order
         </button>
       </div>

       <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
         {['ALL', 'PENDING', 'RUNNING', 'QC_PENDING', 'HOLD', 'COMPLETED'].map(f => (
           <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
             {f.replace('_', ' ')}
           </button>
         ))}
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 font-bold">Job ID</th>
                  <th className="px-6 py-4 font-bold">Customer</th>
                  <th className="px-6 py-4 font-bold">Part / Drawing</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Progress</th>
                  <th className="px-6 py-4 font-bold">Machine</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600 group-hover:text-indigo-700">{job.id}</td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{job.customer}</div>
                        <div className="text-xs text-slate-500 mt-1 flex gap-1">
                             <StatusBadge status={job.customerType} />
                             {job.customerType === 'CONTRACT' ? <span className="font-mono">{job.contractId}</span> : <span>{job.contactPerson}</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{job.partName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{job.drawingNo} ({job.revision})</div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                           <div className={`h-2 rounded-full ${job.status === 'HOLD' ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${(job.completedQty / job.qty) * 100}%` }}></div>
                         </div>
                         <span className="text-xs font-medium text-slate-600">{Math.round((job.completedQty / job.qty) * 100)}%</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{job.currentMachineId || '-'}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setSelectedJob(job); setShowJobCard(true); }} className="p-2 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-lg transition-colors" title="View Job Card"><Eye className="w-4 h-4" /></button>
                         <button onClick={() => { setSelectedJob(job); setActionType('HOLD'); }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors" title="Hold"><Pause className="w-4 h-4" /></button>
                         <button onClick={() => { setSelectedJob(job); setActionType('TRANSFER'); }} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Transfer"><ArrowRightLeft className="w-4 h-4" /></button>
                         <button onClick={() => { setSelectedJob(job); setActionType('RECALL'); }} className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors" title="Recall"><History className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
       </div>

       <JobActionModal job={selectedJob} isOpen={!!selectedJob && !!actionType} onClose={() => { setSelectedJob(null); setActionType(null); }} type={actionType} />
       <JobWizard isOpen={showWizard} onClose={() => setShowWizard(false)} />
       <JobCardModal job={selectedJob} isOpen={showJobCard} onClose={() => { setShowJobCard(false); setSelectedJob(null); }} />
    </div>
  );
};

const PlannerView = () => {
  const { user, logout, jobs } = useApp();
  const [view, setView] = useState<'DASHBOARD' | 'JOBS' | 'MACHINES' | 'QC' | 'REPORTS' | 'MATERIALS' | 'USERS'>('DASHBOARD');
  
  const qcCount = jobs.filter(j => j.status === 'QC_PENDING').length;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-300 flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-white/5">
           <div className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <Factory className="text-white w-6 h-6" />
             </div>
             <div>
                 <span className="block leading-none">Minerva</span>
                 <span className="text-xs text-indigo-400 font-bold tracking-[0.2em] uppercase">Precision</span>
             </div>
           </div>
        </div>
        
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Operations</div>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} />
          <SidebarItem icon={ClipboardList} label="Job Cards" active={view === 'JOBS'} onClick={() => setView('JOBS')} />
          <SidebarItem icon={CheckCircle} label="Quality Control" active={view === 'QC'} onClick={() => setView('QC')} badge={qcCount > 0 ? qcCount : undefined} />
          
          <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Resources</div>
          <SidebarItem icon={Wrench} label="Machine Maint." active={view === 'MACHINES'} onClick={() => setView('MACHINES')} />
          <SidebarItem icon={Package} label="Inventory" active={view === 'MATERIALS'} onClick={() => setView('MATERIALS')} />
          <SidebarItem icon={Users} label="Users" active={view === 'USERS'} onClick={() => setView('USERS')} />
          
          <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Analytics</div>
          <SidebarItem icon={BarChart3} label="Reports" active={view === 'REPORTS'} onClick={() => setView('REPORTS')} />
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
           <div className="flex items-center gap-3 mb-4">
              <img src={user?.avatar} className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600" />
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                 <p className="text-xs text-slate-400 truncate">Production Manager</p>
              </div>
           </div>
           <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 py-2.5 rounded-lg transition-colors font-medium">
              <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-100">
         {/* Top bar can be added here if needed */}
         <div className="flex-1 overflow-auto bg-grid-pattern">
             {view === 'DASHBOARD' && <PlannerDashboard />}
             {view === 'JOBS' && <PlannerJobs />}
             {view === 'QC' && <QCView />}
             {view === 'REPORTS' && <ReportsView />}
             {view === 'MATERIALS' && <MaterialsView />}
             {view === 'MACHINES' && <MaintenanceView />}
             {view === 'USERS' && <UserManagementView />}
         </div>
      </main>
    </div>
  );
};

// --- Auth / Layout Switcher ---

const LoginScreen = () => {
  const { login } = useApp();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1565514020125-9a8bb69842c5?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-900/90"></div>

      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 min-h-[600px] relative z-10 border border-white/20">
        <div className="p-8 md:p-12 flex flex-col justify-center">
           <div className="mb-10">
             <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30">
               <Factory className="text-white w-9 h-9" />
             </div>
             <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3 tracking-tight">Minerva Precision</h1>
             <p className="text-slate-500 text-lg font-medium">Advanced Manufacturing Execution System</p>
           </div>

           <div className="space-y-4">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Persona</div>
             <button onClick={() => login('ADMIN-01')} className="w-full flex items-center p-5 border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left shadow-sm hover:shadow-lg relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500"><ArrowRightLeft className="w-5 h-5"/></div>
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Planner / Manager</h3>
                  <p className="text-sm text-slate-500">Dashboard, Reports & Scheduling</p>
                </div>
             </button>

             <button onClick={() => login('OP-01')} className="w-full flex items-center p-5 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left shadow-sm hover:shadow-lg relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500"><ArrowRightLeft className="w-5 h-5"/></div>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mr-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Shop Floor Operator</h3>
                  <p className="text-sm text-slate-500">Touch Interface & Job Execution</p>
                </div>
             </button>
           </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 hidden md:flex flex-col justify-between p-12 text-white relative overflow-hidden">
           {/* Abstract background shapes */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse-slow"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           
           <div className="relative z-10 mt-12">
               <h2 className="text-4xl font-extrabold mb-6 leading-tight tracking-tight">Precision Manufacturing for the Future.</h2>
               <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
                     <CheckCircle className="w-8 h-8 text-emerald-300" />
                     <div>
                        <p className="font-bold text-lg">Zero Paperwork</p>
                        <p className="text-sm text-indigo-100">Digital job cards & traceability</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
                     <BarChart3 className="w-8 h-8 text-amber-300" />
                     <div>
                        <p className="font-bold text-lg">Real-time Analytics</p>
                        <p className="text-sm text-indigo-100">Instant OEE & KPI tracking</p>
                     </div>
                  </div>
               </div>
           </div>

           <div className="relative z-10">
              <p className="text-xs text-indigo-200 font-medium opacity-80">Minerva Precision OS v2.5.0</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const { user } = useApp();

  if (!user) return <LoginScreen />;

  return user.role === 'OPERATOR' ? <OperatorView /> : <PlannerView />;
};

const App = () => {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);