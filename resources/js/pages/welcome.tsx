import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Check, Clock3, Mail, MapPin, Package, Phone, ShieldCheck } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { clp } from '@/components/funeraria/ui';
import { dashboard, login } from '@/routes';

type LandingProduct = {
    id: number;
    name: string;
    category: string;
    price_clp: number;
    stock: number;
    image_url: string | null;
};

type ServicePackage = {
    title: string;
    description: string;
    includes: string[];
    action: string;
};

type Props = {
    products: LandingProduct[];
    servicePackages: ServicePackage[];
    flow: string[];
};

const phone = '+56 45 221 4500';
const whatsappUrl =
    'https://wa.me/56452214500?text=' +
    encodeURIComponent('Hola, quisiera consultar los servicios funerarios de Cristo Rey.');

export default function Welcome() {
    const { auth, products, servicePackages, flow } = usePage<Props & { auth: { user: unknown } }>().props;

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
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#7b68ae] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#69579b]"
                                >
                                    <Phone className="size-4" />
                                    Consultar por WhatsApp
                                </a>
                                <a
                                    href="#contacto"
                                    className="inline-flex items-center gap-2 rounded-lg border border-[#e5dfd5] bg-white px-5 py-3 text-sm font-semibold text-[#5a4a86] transition hover:bg-[#f1ecf8]"
                                >
                                    Ver contacto
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
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b68ae]">Servicios funerarios</p>
                            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Un acompañamiento integral</h2>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#7a7285]">
                                Cada servicio se coordina con nuestra familia colaboradora y se registra
                                en el sistema para dar seguimiento claro a su solicitud.
                            </p>
                            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                                {servicePackages.map((service, index) => (
                                    <article key={service.title} className="funeraria-card flex flex-col p-6">
                                        <span className="flex size-10 items-center justify-center rounded-lg bg-[#f1ecf8] text-sm font-semibold text-[#7b68ae]">
                                            0{index + 1}
                                        </span>
                                        <h3 className="mt-5 font-semibold">{service.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-[#7a7285]">{service.description}</p>
                                        <ul className="mt-4 space-y-1.5 text-xs text-[#6f6878]">
                                            {service.includes.map((item) => (
                                                <li key={item} className="flex items-start gap-2">
                                                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#2f6b45]" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                        <a
                                            href="#contacto"
                                            className="mt-auto pt-5 text-sm font-semibold text-[#5a4a86] transition hover:text-[#7b68ae]"
                                        >
                                            {service.action} <span aria-hidden="true">→</span>
                                        </a>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="minicatalogo" className="mx-auto max-w-6xl px-6 py-16">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b68ae]">Minicatálogo</p>
                                <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Urnas y ataúdes disponibles</h2>
                                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#7a7285]">
                                    Precios de referencia en pesos chilenos. Su disponibilidad final se
                                    confirma al coordinar la reserva con nuestro equipo.
                                </p>
                            </div>
                            <Link
                                href={auth.user ? '/catalogo' : login().url}
                                className="inline-flex items-center gap-2 self-start rounded-lg border border-[#e5dfd5] bg-white px-4 py-2.5 text-sm font-semibold text-[#5a4a86] transition hover:bg-[#f1ecf8]"
                            >
                                {auth.user ? 'Ver catálogo completo' : 'Ingresar para ver el catálogo'}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>

                        {products.length === 0 ? (
                            <div className="funeraria-card mt-8 p-8 text-center text-sm text-[#7a7285]">
                                Estamos actualizando nuestro catálogo. Consulte disponibilidad por teléfono.
                            </div>
                        ) : (
                            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {products.map((product) => (
                                    <article key={product.id} className="funeraria-card overflow-hidden">
                                        <div className="flex h-44 items-center justify-center bg-[#f1ecf8]">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="size-full object-contain p-4"
                                                />
                                            ) : (
                                                <Package className="size-12 text-[#7b68ae]" />
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[#7b68ae]">
                                                {product.category}
                                            </p>
                                            <h3 className="mt-1 font-semibold">{product.name}</h3>
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <span className="text-lg font-semibold text-[#2d2542]">{clp(product.price_clp)}</span>
                                                <span
                                                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                                        product.stock > 0
                                                            ? 'border-[#cbe6d5] bg-[#eaf5ee] text-[#2f6b45]'
                                                            : 'border-[#f0dfb5] bg-[#fdf3df] text-[#8a651c]'
                                                    }`}
                                                >
                                                    {product.stock > 0 ? 'Disponible' : 'Consultar'}
                                                </span>
                                            </div>
                                            <a
                                                href={whatsappUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#5a4a86] transition hover:text-[#7b68ae]"
                                            >
                                                Consultar y reservar
                                                <ArrowRight className="size-4" />
                                            </a>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                        <div className="funeraria-card mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#7b68ae]">Cómo funciona</p>
                                <p className="mt-1 text-sm text-[#6f6878]">
                                    {flow.join(' → ')}. La boleta se emite al finalizar el pago total.
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-2 text-xs text-[#8b8495]">
                                <ShieldCheck className="size-4 text-[#7b68ae]" />
                                Atención reservada y confidencial
                            </span>
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
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <a
                                        href={`tel:${phone.replace(/\s/g, '')}`}
                                        className="inline-flex items-center gap-2 rounded-lg bg-[#7b68ae] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#69579b]"
                                    >
                                        <Phone className="size-4" /> Llamar ahora
                                    </a>
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg border border-[#e5dfd5] bg-white px-4 py-2.5 text-sm font-semibold text-[#5a4a86] transition hover:bg-[#f1ecf8]"
                                    >
                                        WhatsApp
                                        <ArrowRight className="size-4" />
                                    </a>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm text-[#5f576e]">
                                <p className="flex items-center gap-3"><MapPin className="size-4 text-[#7b68ae]" /> Av. Alemania 0450, Temuco, Chile</p>
                                <p className="flex items-center gap-3"><Phone className="size-4 text-[#7b68ae]" /> {phone}</p>
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
