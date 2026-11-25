import { lazy, Suspense, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  LayoutDashboard, Users, CalendarPlus, UserCircle, Package, MapPin,
  CalendarRange, Clock, FileText, BarChart3,
  TrendingUp, TrendingDown, Wallet, FileBarChart, PiggyBank, ShieldCheck,
  Car, PackageCheck, FileStack,
  ClipboardCheck, Star,
  FileSpreadsheet, Share2, ClipboardList,
  LogOut,
} from 'lucide-react';
import Sidebar, { PageKey, NavGroup } from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TimPage = lazy(() => import('@/pages/TimPage'));
const BookingPage = lazy(() => import('@/pages/BookingPage'));
const UserPage = lazy(() => import('@/pages/UserPage'));
const ServicePage = lazy(() => import('@/pages/ServicePage'));
const AreaPage = lazy(() => import('@/pages/AreaPage'));
const PlannerPage = lazy(() => import('@/pages/PlannerPage'));
const SchedulePage = lazy(() => import('@/pages/SchedulePage'));
const CaptionPage = lazy(() => import('@/pages/CaptionPage'));
const EvaluasiSosmedPage = lazy(() => import('@/pages/EvaluasiSosmedPage'));
const PendapatanPage = lazy(() => import('@/pages/PendapatanPage'));
const BiayaOperasionalPage = lazy(() => import('@/pages/BiayaOperasionalPage'));
const PembayaranPage = lazy(() => import('@/pages/PembayaranPage'));
const LaporanKeuanganPage = lazy(() => import('@/pages/LaporanKeuanganPage'));
const KasPage = lazy(() => import('@/pages/KasPage'));
const TransportasiPage = lazy(() => import('@/pages/TransportasiPage'));
const InventarisPage = lazy(() => import('@/pages/InventarisPage'));
const DokumenPage = lazy(() => import('@/pages/DokumenPage'));
const EvaluasiLayananPage = lazy(() => import('@/pages/EvaluasiLayananPage'));
const EvaluasiKepuasanPage = lazy(() => import('@/pages/EvaluasiKepuasanPage'));
const LaporanBookingPage = lazy(() => import('@/pages/LaporanBookingPage'));
const LaporanSosmedPage = lazy(() => import('@/pages/LaporanSosmedPage'));
const LaporanLayananPage = lazy(() => import('@/pages/LaporanLayananPage'));

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'DASHBOARD',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'admin', label: 'Akses Admin', icon: ShieldCheck },
    ],
  },
  {
    title: 'TIM & LAYANAN',
    items: [
      { key: 'tim', label: 'Daftar Tim', icon: Users },
      { key: 'booking', label: 'Booking', icon: CalendarPlus },
      { key: 'user', label: 'User', icon: UserCircle },
      { key: 'layanan', label: 'Daftar Layanan', icon: Package },
      { key: 'area', label: 'Area Layanan', icon: MapPin },
    ],
  },
  {
    title: 'SOSMED',
    items: [
      { key: 'planner', label: 'Content Planner', icon: CalendarRange },
      { key: 'schedule', label: 'Content Schedule', icon: Clock },
      { key: 'caption', label: 'Bank Caption', icon: FileText },
      { key: 'evaluasi-sosmed', label: 'Evaluasi Sosmed', icon: BarChart3 },
    ],
  },
  {
    title: 'KEUANGAN',
    items: [
      { key: 'pendapatan', label: 'Pendapatan', icon: TrendingUp },
      { key: 'biaya-operasional', label: 'Biaya Operasional', icon: TrendingDown },
      { key: 'pembayaran', label: 'Pembayaran', icon: Wallet },
      { key: 'kas', label: 'Kas Bulanan', icon: PiggyBank },
      { key: 'laporan-keuangan', label: 'Laporan Keuangan', icon: FileBarChart },
    ],
  },
  {
    title: 'OPERASIONAL',
    items: [
      { key: 'transportasi', label: 'Transportasi', icon: Car },
      { key: 'inventaris', label: 'Inventaris', icon: PackageCheck },
      { key: 'dokumen', label: 'Dokumen & SOP', icon: FileStack },
    ],
  },
  {
    title: 'EVALUASI',
    items: [
      { key: 'evaluasi-layanan', label: 'Evaluasi Layanan', icon: ClipboardCheck },
      { key: 'evaluasi-kepuasan', label: 'Evaluasi Kepuasan User', icon: Star },
    ],
  },
  {
    title: 'LAPORAN',
    items: [
      { key: 'laporan-booking', label: 'Laporan Booking', icon: FileSpreadsheet },
      { key: 'laporan-sosmed', label: 'Laporan Sosmed', icon: Share2 },
      { key: 'laporan-keuangan', label: 'Laporan Keuangan', icon: FileBarChart },
      { key: 'laporan-layanan', label: 'Laporan Layanan', icon: ClipboardList },
    ],
  },
];

const MOBILE_ITEMS = NAV_GROUPS.flatMap(g => g.items).slice(0, 5);

function App() {
  const [active, setActive] = useState<PageKey>('dashboard');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    setIsAdmin(null);
    supabase.rpc('is_allowed_admin').then(({ data, error }) => {
      if (error) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(data === true);
    });
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActive('dashboard');
  };

  useEffect(() => {
    if (!session || !isAdmin) return;

    const channel = supabase
      .channel('dampingcare-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: '*' }, () => {
        setRefreshVersion(version => version + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, isAdmin]);

  const pageMap: Record<PageKey, React.ReactNode> = {
    'dashboard': <DashboardPage />,
    'admin': <AdminPage />,
    'tim': <TimPage />,
    'booking': <BookingPage />,
    'user': <UserPage />,
    'layanan': <ServicePage />,
    'area': <AreaPage />,
    'planner': <PlannerPage />,
    'schedule': <SchedulePage />,
    'caption': <CaptionPage />,
    'evaluasi-sosmed': <EvaluasiSosmedPage />,
    'pendapatan': <PendapatanPage />,
    'biaya-operasional': <BiayaOperasionalPage />,
    'pembayaran': <PembayaranPage />,
    'laporan-keuangan': <LaporanKeuanganPage />,
    'kas': <KasPage />,
    'transportasi': <TransportasiPage />,
    'inventaris': <InventarisPage />,
    'dokumen': <DokumenPage />,
    'evaluasi-layanan': <EvaluasiLayananPage />,
    'evaluasi-kepuasan': <EvaluasiKepuasanPage />,
    'laporan-booking': <LaporanBookingPage />,
    'laporan-sosmed': <LaporanSosmedPage />,
    'laporan-layanan': <LaporanLayananPage />,
  };

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-sm text-gray-500">Memuat…</p>
        </div>
      </div>
    );
  }

  if (!session || isAdmin === false) {
    return (
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><LoadingSpinner /></div>}>
        <LoginPage />
      </Suspense>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-sm text-gray-500">Memeriksa akses…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar groups={NAV_GROUPS} active={active} onNavigate={setActive} onSignOut={handleSignOut} />
      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <h1 className="text-base font-bold text-gray-900 md:text-lg">Dampingcare Management System</h1>
        </header>
        <main className="px-4 py-5 pb-24 md:px-6 md:pb-6">
          <Suspense fallback={<div className="flex min-h-64 items-center justify-center"><LoadingSpinner /></div>}>
            <div key={`${active}-${refreshVersion}`}>{pageMap[active]}</div>
          </Suspense>
        </main>
      </div>
      <BottomNav items={MOBILE_ITEMS} active={active} onNavigate={setActive} />
    </div>
  );
}

export default App;
