import { Link, usePage } from '@inertiajs/react';
import {
    Archive,
    BarChart3,
    CalendarDays,
    ClipboardList,
    FileText,
    LayoutDashboard,
    Receipt,
    Sparkles,
    Truck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { can, roleLabel } = usePage().props;

    const mainNavItems: NavItem[] = [
        { title: 'Panel General', href: dashboard().url, icon: LayoutDashboard },
        ...(can.servicios ? [{ title: 'Servicios funerarios', href: '/servicios', icon: Sparkles }] : []),
        ...(can.expedientes ? [{ title: 'Expedientes', href: '/expedientes', icon: FileText }] : []),
        ...(can.catalogo ? [{ title: 'Urnas y Ataúdes', href: '/catalogo', icon: Archive }] : []),
        ...(can.reservas ? [{ title: 'Reservas', href: '/reservas', icon: ClipboardList }] : []),
        ...(can.boletas ? [{ title: 'Boletas y Cobros', href: '/boletas', icon: Receipt }] : []),
        ...(can.informes ? [{ title: 'Informes por Fecha', href: '/informes', icon: BarChart3 }] : []),
        ...(can.ausencias ? [{ title: 'Ausencias', href: '/ausencias', icon: Users }] : []),
        ...(can.calendario ? [{ title: 'Calendario', href: '/calendario', icon: CalendarDays }] : []),
        ...(can.flota ? [{ title: 'Hoja de Ruta', href: '/flota', icon: Truck }] : []),
        ...(can.usuarios ? [{ title: 'Usuarios y Roles', href: '/usuarios', icon: Users }] : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard().url} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <div className="px-3 pb-1 text-[11px] font-medium tracking-wide text-white/70 uppercase group-data-[collapsible=icon]:hidden">
                    Perfil: {roleLabel}
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
