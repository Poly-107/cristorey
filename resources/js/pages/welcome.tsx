import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Clock3, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login } from '@/routes';

const services = [
    {
        title: 'Servicios funerarios',
        text: 'Acompañamiento integral en cada etapa: recepción, preparación, velatorio y ceremonia.',
    },
    {
        title: 'Velatorios y ceremonias',
        text: 'Salas confortables y espacios de despedida adaptados a la tradición de cada familia.',
    },
    {
        title: 'Traslados y cremación',
        text: 'Coordinación de recorridos, traslados y gestiones con cementerios y crematorios.',
    },
];

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Funeraria Cristo Rey | Temuco" />
            <div className="min-h-screen bg-[#faf8f5] text-[#2d2542]">
                <header className="border-b border-[#e5dfd5] bg-white/80 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#7b68ae] to-[#2d2542] text-white">
                                <AppLogoIcon className="size-5 fill-current" />
                            </span>
                            <div>
                                <p className="text-sm leading-tight font-semibold">Funeraria Cristo Rey</p>
                                <p className="text-xs text-[#8b8495]">Temuco, Chile</p>
                            </div>
                        </div>
                        <Link
                            href={auth.user ? dashboard().url : login().url}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#7b68ae] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#69579b]"
                        >
                            {auth.user ? 'Ir al panel' : 'Acceder al sistema'}
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </header>

                <main>
                    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#e5dfd5] bg-white px-3 py-1 text-xs font-medium text-[#7b68ae]">
                                <ShieldCheck className="size-3.5" />
                                Servicio funerario en Temuco
                            </span>
                            <h1 className="mt-6 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
                                Acompañamos cada despedida con{' '}
                                <span className="text-[#7b68ae]">respeto y serenidad</span>
                            </h1>
                            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6f6878]">
                                En Funeraria Cristo Rey cuidamos cada detalle para que su familia pueda
                                despedirse con tranquilidad. Nos encargamos de los servicios funerarios,
                                velatorios, ceremonias y traslados con atención cercana y profesional.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href={auth.user ? dashboard().url : login().url}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#7b68ae] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#69579b]"
                                >
                                    {auth.user ? 'Ingresar al panel de gestión' : 'Ingresar al sistema'}
                                    <ArrowRight className="size-4" />
                                </Link>
                                <a
                                    href="#contacto"
                                    className="inline-flex items-center gap-2 rounded-lg border border-[#e5dfd5] bg-white px-5 py-3 text-sm font-semibold text-[#5a4a86] transition hover:bg-[#f1ecf8]"
                                >
                                    Contactar
                                </a>
                            </div>
                            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#7a7285]">
                                <span className="flex items-center gap-2"><Clock3 className="size-4 text-[#7b68ae]" /> Atención 24 horas</span>
                                <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#7b68ae]" /> Equipo experimentado</span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#7b68ae] via-[#5a4a86] to-[#2d2542] p-10 text-white shadow-xl">
                                <div className="absolute -right-16 -bottom-16 size-72 rounded-full border border-white/10" />
                                <div className="absolute -right-4 -bottom-24 size-72 rounded-full border border-white/10" />
                                <AppLogoIcon className="size-14 fill-current opacity-90" />
                                <h2 className="mt-10 text-3xl font-semibold">Cristo Rey</h2>
                                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
                                    Una casa funeraria dedicada a acompañar a las familias de Temuco
                                    con dignidad, calidez y compromiso.
                                </p>
                                <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/15 pt-6">
                                    <div>
                                        <p className="text-2xl font-semibold">24/7</p>
                                        <p className="text-xs text-white/65">Atención permanente</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold">Temuco</p>
                                        <p className="text-xs text-white/65">Nuestra ciudad</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-y border-[#e5dfd5] bg-white">
                        <div className="mx-auto max-w-6xl px-6 py-16">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b68ae]">Nuestros servicios</p>
                            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Un acompañamiento integral</h2>
                            <div className="mt-8 grid gap-5 md:grid-cols-3">
                                {services.map((service, index) => (
                                    <article key={service.title} className="funeraria-card p-6">
                                        <span className="flex size-10 items-center justify-center rounded-lg bg-[#f1ecf8] text-sm font-semibold text-[#7b68ae]">
                                            0{index + 1}
                                        </span>
                                        <h3 className="mt-5 font-semibold">{service.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-[#7a7285]">{service.text}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="contacto" className="mx-auto max-w-6xl px-6 py-16">
                        <div className="funeraria-card grid gap-8 p-8 md:grid-cols-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b68ae]">Contacto</p>
                                <h2 className="mt-3 text-2xl font-semibold">Estamos para ayudarle</h2>
                                <p className="mt-3 text-sm leading-relaxed text-[#7a7285]">
                                    Nuestro equipo está disponible para orientarle en cada paso,
                                    con información clara y atención humana.
                                </p>
                            </div>
                            <div className="space-y-3 text-sm text-[#5f576e]">
                                <p className="flex items-center gap-3"><MapPin className="size-4 text-[#7b68ae]" /> Av. Alemania 0450, Temuco, Chile</p>
                                <p className="flex items-center gap-3"><Phone className="size-4 text-[#7b68ae]" /> +56 45 221 4500</p>
                                <p className="flex items-center gap-3"><Mail className="size-4 text-[#7b68ae]" /> contacto@cristorey.cl</p>
                                <p className="flex items-center gap-3"><Clock3 className="size-4 text-[#7b68ae]" /> Atención las 24 horas, todos los días</p>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-[#e5dfd5] bg-white">
                    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-[#8b8495] sm:flex-row sm:items-center sm:justify-between">
                        <p>© {new Date().getFullYear()} Funeraria Cristo Rey · Temuco, Chile</p>
                        <p>Sistema integral de gestión funeraria e inventario</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
