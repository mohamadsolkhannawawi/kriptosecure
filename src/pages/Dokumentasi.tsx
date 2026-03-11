import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Lock,
    Binary,
    Shield,
    Key,
    ArrowRight,
    Layers,
    BookOpen,
    Zap,
    CheckCircle2,
} from "lucide-react";
import Header from "@/components/Header";

// ── Animation ─────────────────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.09,
            duration: 0.45,
            ease: "easeOut" as const,
        },
    }),
};

// ── Data ──────────────────────────────────────────────────────────────────────
const securityComponents = [
    {
        icon: Lock,
        title: "Multi-Prime RSA",
        variant: "primary" as const,
        description:
            "Berbeda dari RSA standar (2 prima), sistem ini menggunakan tiga bilangan prima untuk modulus yang lebih kuat terhadap serangan faktorisasi.",
        formula: (
            <span>
                n = p<sub>1</sub> × p<sub>2</sub> × p<sub>3</sub>
            </span>
        ),
    },
    {
        icon: Binary,
        title: "Fibonacci Keystream",
        variant: "accent" as const,
        description:
            "Deret Fibonacci modulo 256 menghasilkan kunci aliran dinamis yang unik untuk setiap byte, memberikan sifat stream cipher yang kuat.",
        formula: (
            <span>
                K<sub>r</sub> = F(r) mod 256
            </span>
        ),
    },
    {
        icon: Zap,
        title: "XOR Feedback & IV",
        variant: "primary" as const,
        description:
            "Mekanisme umpan balik (cipher feedback) dengan Vektor Inisialisasi IV = 38 memastikan byte pertama tetap unik dan tidak dapat diprediksi.",
        formula: (
            <span>
                y<sub>r</sub> = x<sub>r</sub> ⊕ K<sub>r</sub> ⊕ y<sub>r−1</sub>,
                &ensp; y<sub>0</sub> = 38
            </span>
        ),
    },
    {
        icon: Shield,
        title: "Permutasi Bit (π)",
        variant: "accent" as const,
        description:
            "Lapisan permutasi mengacak posisi bit dalam setiap byte menggunakan pola tetap, menambah kompleksitas tanpa overhead komputasi besar.",
        formula: <span>π = [8, 7, 1, 5, 3, 6, 2, 4]</span>,
    },
];

const keygenSteps = [
    {
        label: "Input Tiga Prima",
        formula: (
            <span>
                p<sub>1</sub>, p<sub>2</sub>, p<sub>3</sub>, e
            </span>
        ),
        note: "Pilih tiga bilangan prima berbeda dan eksponen publik e yang koprima terhadap φ(n).",
        color: "muted" as const,
    },
    {
        label: "Hitung Modulus",
        formula: (
            <span>
                n = p<sub>1</sub> × p<sub>2</sub> × p<sub>3</sub>
            </span>
        ),
        note: "Modulus n adalah hasil perkalian tiga bilangan prima, lebih kuat dari RSA standar.",
        color: "primary" as const,
    },
    {
        label: "Hitung Euler Totient",
        formula: (
            <span>
                φ(n) = (p<sub>1</sub>−1)(p<sub>2</sub>−1)(p<sub>3</sub>−1)
            </span>
        ),
        note: "Generalisasi fungsi totient untuk tiga faktor prima, menentukan ruang kunci privat.",
        color: "accent" as const,
    },
    {
        label: "Hitung Kunci Privat",
        formula: (
            <span>
                d ≡ e<sup>−1</sup> (mod φ(n))
            </span>
        ),
        note: "Invers modular dihitung menggunakan Extended Euclidean Algorithm (EEA).",
        color: "primary" as const,
    },
];

const encryptSteps = [
    {
        num: 1,
        title: "RSA Encryption",
        icon: Lock,
        color: "primary" as const,
        desc: "Setiap karakter dikonversi ke kode ASCII (m), lalu dienkripsi menggunakan kunci publik (e, n) menjadi nilai integer x\u1D62.",
        formula: (
            <span>
                x<sub>i</sub> = m<sup>e</sup> mod n
            </span>
        ),
        note: "Block size k = ⌈log₂₅₆ n⌉ byte per karakter.",
    },
    {
        num: 2,
        title: "Base-256 Conversion",
        icon: Layers,
        color: "accent" as const,
        desc: "Nilai integer x\u1D62 dipecah menjadi k byte representasi big-endian untuk diproses oleh stream cipher.",
        formula: (
            <span>
                x<sub>i</sub> → [b<sub>1</sub>, b<sub>2</sub>, …, b<sub>k</sub>]
                &ensp;(base-256, big-endian)
            </span>
        ),
        note: null,
    },
    {
        num: 3,
        title: "Stream XOR + Fibonacci Feedback",
        icon: Binary,
        color: "accent" as const,
        desc: "Setiap byte di-XOR dengan keystream Fibonacci (K\u1D63) dan byte ciphertext sebelumnya (y\u1D63₋₁). Byte pertama menggunakan IV = 38 sebagai y₀.",
        formula: (
            <>
                <span>
                    y<sub>r</sub> = (x<sub>r</sub> ⊕ K<sub>r</sub> ⊕ y
                    <sub>r−1</sub>) mod 256
                </span>
                <br />
                <span className="text-xs text-muted-foreground">
                    K<sub>r</sub> = Fib(r) mod 256, &ensp; y<sub>0</sub> = IV =
                    38
                </span>
            </>
        ),
        note: null,
    },
    {
        num: 4,
        title: "Bit Permutation",
        icon: Shield,
        color: "primary" as const,
        desc: "Setiap byte y\u1D63 dilakukan permutasi bit menggunakan peta tetap untuk menghasilkan byte ciphertext final.",
        formula: (
            <span>
                c<sub>r</sub> = π(y<sub>r</sub>) &ensp;— map: [8, 7, 1, 5, 3, 6,
                2, 4]
            </span>
        ),
        note: null,
    },
];

const decryptSteps = [
    {
        num: 1,
        title: "Inverse Bit Permutation",
        icon: Shield,
        color: "primary" as const,
        desc: "Setiap byte ciphertext di-permutasi balik menggunakan peta invers (π⁻¹) untuk membatalkan pengacakan bit tahap enkripsi.",
        formula: (
            <span>
                y<sub>r</sub> = π<sup>−1</sup>(c<sub>r</sub>)
            </span>
        ),
        note: null,
    },
    {
        num: 2,
        title: "Reverse XOR + Feedback",
        icon: Binary,
        color: "accent" as const,
        desc: "Byte hasil invers permutasi di-XOR dengan keystream Fibonacci (K\u1D63) dan byte ciphertext sebelumnya untuk memulihkan byte RSA asli.",
        formula: (
            <span>
                x<sub>r</sub> = (y<sub>r</sub> ⊕ K<sub>r</sub> ⊕ c<sub>r−1</sub>
                ) mod 256
            </span>
        ),
        note: "c\u1D63₋₁ = byte ciphertext sebelumnya (nilai sebelum inverse permutation).",
    },
    {
        num: 3,
        title: "Byte Reassembly",
        icon: Layers,
        color: "accent" as const,
        desc: "Setiap kelompok k byte di-reassemble kembali menjadi nilai integer x\u1D62 menggunakan representasi big-endian.",
        formula: (
            <span>
                [b<sub>1</sub>, …, b<sub>k</sub>] → x<sub>i</sub> &ensp;
                (base-256 reassemble)
            </span>
        ),
        note: null,
    },
    {
        num: 4,
        title: "RSA Decryption",
        icon: Lock,
        color: "primary" as const,
        desc: "Nilai integer x\u1D62 didekripsi menggunakan kunci privat (d, n) untuk mendapatkan kode ASCII asli, yang kemudian dikonversi kembali ke karakter.",
        formula: (
            <span>
                m<sub>i</sub> = x<sub>i</sub>
                <sup>d</sup> mod n
            </span>
        ),
        note: null,
    },
];

const encryptPipeline = [
    { label: "Plaintext", sub: "input", type: "io" as const },
    { label: "RSA Encrypt", sub: "mᵉ mod n", type: "primary" as const },
    { label: "Base-256", sub: "k bytes", type: "accent" as const },
    { label: "XOR + Fib", sub: "IV = 38", type: "accent" as const },
    { label: "Bit Perm π", sub: "[8,7,1,5,3,6,2,4]", type: "primary" as const },
    { label: "Ciphertext", sub: "output", type: "io" as const },
];

const decryptPipeline = [
    { label: "Ciphertext", sub: "input", type: "io" as const },
    { label: "Inv. π⁻¹", sub: "inverse perm", type: "primary" as const },
    { label: "Rev. XOR", sub: "feedback", type: "accent" as const },
    { label: "Reassemble", sub: "base-256", type: "accent" as const },
    { label: "RSA Decrypt", sub: "xᵈ mod n", type: "primary" as const },
    { label: "Plaintext", sub: "output", type: "io" as const },
];

const traceStages = [
    {
        icon: Lock,
        color: "primary" as const,
        label: "RSA Stage",
        desc: "Menghitung mᵉ mod n dari input karakter — setiap karakter ASCII diproses secara individual menggunakan kunci publik (e, n).",
    },
    {
        icon: Zap,
        color: "accent" as const,
        label: "Stream Stage",
        desc: "Membangkitkan Keystream Fibonacci dan menerapkan XOR dengan feedback IV = 38 — menghasilkan ciphertext stream yang bergantung konteks.",
    },
    {
        icon: Shield,
        color: "primary" as const,
        label: "Permutation Stage",
        desc: "Mengacak 8-bit data menggunakan map [8, 7, 1, 5, 3, 6, 2, 4] — setiap bit dipindahkan ke posisi baru yang telah ditentukan.",
    },
    {
        icon: CheckCircle2,
        color: "accent" as const,
        label: "Finalization",
        desc: "Menggabungkan seluruh byte menjadi output biner gabungan — output akhir adalah string biner yang merepresentasikan semua byte ciphertext.",
    },
];

// ── Pipeline Visualizer ───────────────────────────────────────────────────────
type PipeBox = {
    label: string;
    sub: string;
    type: "io" | "primary" | "accent";
};
function Pipeline({ steps, label }: { steps: PipeBox[]; label: string }) {
    const typeClass = {
        io: "bg-secondary text-foreground border-border",
        primary: "bg-primary/15 text-primary border-primary/30",
        accent: "bg-accent/15 text-accent border-accent/30",
    };
    return (
        <div className="mb-4">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-widest mb-3">
                {label}
            </p>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {steps.map((box, i) => (
                    <div
                        key={box.label + i}
                        className="flex items-center gap-1.5 flex-shrink-0"
                    >
                        <div
                            className={`rounded-md border px-3 py-2 text-center min-w-[80px] ${typeClass[box.type]}`}
                        >
                            <p className="font-heading text-xs font-semibold whitespace-nowrap">
                                {box.label}
                            </p>
                            <p className="font-body text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                                {box.sub}
                            </p>
                        </div>
                        {i < steps.length - 1 && (
                            <ArrowRight
                                size={13}
                                className="text-muted-foreground flex-shrink-0"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Step Card ─────────────────────────────────────────────────────────────────
function StepCard({
    step,
    index,
}: {
    step: (typeof encryptSteps)[0];
    index: number;
}) {
    const Icon = step.icon;
    return (
        <motion.div
            variants={fadeUp}
            custom={index}
            initial="hidden"
            animate="visible"
            className="flex gap-4 items-start"
        >
            <div
                className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    step.color === "primary"
                        ? "bg-primary/10 border border-primary/25 text-primary"
                        : "bg-accent/10 border border-accent/25 text-accent"
                }`}
            >
                <Icon size={16} />
            </div>
            <div className="flex-1 rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                    <span
                        className={`font-heading text-xs font-bold border rounded px-1.5 py-0.5 ${
                            step.color === "primary"
                                ? "border-primary/30 text-primary"
                                : "border-accent/30 text-accent"
                        }`}
                    >
                        Tahap {step.num}
                    </span>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                        {step.title}
                    </h3>
                </div>
                <p className="font-body text-sm text-muted-foreground mb-3 leading-relaxed">
                    {step.desc}
                </p>
                <div
                    className={`rounded-md px-4 py-2.5 text-center font-heading text-sm leading-loose ${
                        step.color === "primary"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-accent/10 text-accent border border-accent/20"
                    }`}
                >
                    {step.formula}
                </div>
                {step.note && (
                    <p className="mt-2.5 font-body text-xs text-muted-foreground leading-relaxed">
                        <span className="text-foreground/60">ℹ</span>{" "}
                        {step.note}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
const Dokumentasi = () => {
    const [activeTab, setActiveTab] = useState<
        "keygen" | "encrypt" | "decrypt"
    >("keygen");

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const el = document.querySelector(hash);
            if (el)
                setTimeout(
                    () => el.scrollIntoView({ behavior: "smooth" }),
                    150,
                );
        }
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* ── Page Hero ──────────────────────────────────────────────── */}
            <section className="pt-32 pb-16 px-4 border-b border-border">
                <div className="container max-w-5xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        custom={0}
                        className="flex items-center gap-2 mb-4"
                    >
                        <BookOpen size={14} className="text-muted-foreground" />
                        <span className="font-body text-xs text-muted-foreground tracking-widest uppercase">
                            Dokumentasi Teknis
                        </span>
                    </motion.div>
                    <motion.h1
                        variants={fadeUp}
                        custom={1}
                        initial="hidden"
                        animate="visible"
                        className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight"
                    >
                        Sistem Kriptografi{" "}
                        <span className="text-primary">KriptoSecure</span>
                    </motion.h1>
                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        initial="hidden"
                        animate="visible"
                        className="mt-4 font-body text-base text-muted-foreground max-w-2xl leading-relaxed"
                    >
                        Dokumentasi lengkap algoritma kriptografi hybrid yang
                        menggabungkan{" "}
                        <span className="text-primary font-medium">
                            Multi-Prime RSA
                        </span>
                        ,{" "}
                        <span className="text-accent font-medium">
                            Fibonacci Stream Cipher
                        </span>
                        , dan{" "}
                        <span className="text-primary font-medium">
                            Permutasi Bit
                        </span>{" "}
                        dalam satu pipeline keamanan berlapis.
                    </motion.p>
                    <motion.div
                        variants={fadeUp}
                        custom={3}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-wrap gap-2 mt-6"
                    >
                        {[
                            { label: "Multi-Prime RSA", v: "primary" },
                            { label: "Fibonacci Keystream", v: "accent" },
                            { label: "XOR Feedback IV=38", v: "primary" },
                            { label: "Bit Permutation π", v: "accent" },
                        ].map(({ label, v }) => (
                            <span
                                key={label}
                                className={`px-3 py-1 rounded-full text-xs font-body font-medium border ${
                                    v === "primary"
                                        ? "bg-primary/10 text-primary border-primary/25"
                                        : "bg-accent/10 text-accent border-accent/25"
                                }`}
                            >
                                {label}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── 1. Pendahuluan ─────────────────────────────────────────── */}
            <section id="dokumentasi" className="py-16 px-4">
                <div className="container max-w-5xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                            1. Pendahuluan
                        </h2>
                        <div className="w-10 h-0.5 bg-primary rounded mb-6" />
                        <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-3xl">
                            KriptoSecure adalah sistem kriptografi{" "}
                            <strong className="text-foreground">
                                hybrid inovatif
                            </strong>{" "}
                            yang menggabungkan kekuatan algoritma asimetris
                            (Multi-Prime RSA) dengan kecepatan dan kompleksitas
                            algoritma simetris (Stream Cipher berbasis
                            Fibonacci) serta pengacakan posisi melalui Permutasi
                            Bit. Sistem ini dirancang untuk memberikan
                            perlindungan berlapis yang kuat secara matematis
                            sekaligus efisien secara komputasional.
                        </p>
                    </motion.div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                title: "Kunci Asimetris",
                                desc: "Multi-Prime RSA dengan 3 faktor prima untuk distribusi kunci yang aman secara matematis.",
                                color: "primary",
                                icon: Key,
                            },
                            {
                                title: "Enkripsi Simetris",
                                desc: "Fibonacci Stream Cipher dengan feedback memberikan enkripsi byte-per-byte yang dinamis.",
                                color: "accent",
                                icon: Binary,
                            },
                            {
                                title: "Pengacakan Bit",
                                desc: "Permutasi bit tetap menambah lapisan keamanan pada setiap byte output tanpa overhead besar.",
                                color: "primary",
                                icon: Shield,
                            },
                        ].map(({ title, desc, color, icon: Icon }, i) => (
                            <motion.div
                                key={title}
                                variants={fadeUp}
                                custom={i + 1}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="rounded-lg border border-border bg-card p-5"
                            >
                                <div
                                    className={`mb-3 inline-flex items-center justify-center w-9 h-9 rounded-md ${
                                        color === "primary"
                                            ? "bg-primary/10 text-primary"
                                            : "bg-accent/10 text-accent"
                                    }`}
                                >
                                    <Icon size={18} />
                                </div>
                                <h3 className="font-heading text-sm font-semibold text-foreground mb-1">
                                    {title}
                                </h3>
                                <p className="font-body text-xs text-muted-foreground leading-relaxed">
                                    {desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 2. Komponen Keamanan ──────────────────────────────────── */}
            <section className="py-16 px-4 border-t border-border bg-card/30">
                <div className="container max-w-5xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                            2. Komponen Keamanan Utama
                        </h2>
                        <div className="w-10 h-0.5 bg-primary rounded mb-8" />
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {securityComponents.map(
                            (
                                {
                                    icon: Icon,
                                    title,
                                    variant,
                                    description,
                                    formula,
                                },
                                i,
                            ) => (
                                <motion.div
                                    key={title}
                                    variants={fadeUp}
                                    custom={i}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="rounded-lg border border-border bg-card p-6 flex flex-col gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex items-center justify-center w-10 h-10 rounded-md ${
                                                variant === "primary"
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-accent/10 text-accent"
                                            }`}
                                        >
                                            <Icon size={20} />
                                        </div>
                                        <h3 className="font-heading text-base font-semibold text-foreground">
                                            {title}
                                        </h3>
                                    </div>
                                    <p className="font-body text-sm text-muted-foreground leading-relaxed">
                                        {description}
                                    </p>
                                    <div
                                        className={`rounded-md px-4 py-2.5 text-center font-heading text-sm leading-loose ${
                                            variant === "primary"
                                                ? "bg-primary/10 text-primary border border-primary/20"
                                                : "bg-accent/10 text-accent border border-accent/20"
                                        }`}
                                    >
                                        {formula}
                                    </div>
                                </motion.div>
                            ),
                        )}
                    </div>
                </div>
            </section>

            {/* ── 3. Cara Kerja ─────────────────────────────────────────── */}
            <section
                id="cara-kerja"
                className="py-16 px-4 border-t border-border"
            >
                <div className="container max-w-5xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                            3. Cara Kerja: Alur Enkripsi &amp; Dekripsi
                        </h2>
                        <div className="w-10 h-0.5 bg-primary rounded mb-6" />
                        <p className="font-body text-sm text-muted-foreground mb-6 max-w-3xl leading-relaxed">
                            Pipeline keamanan KriptoSecure terdiri dari tiga
                            tahap utama yang bekerja secara berurutan. Setiap
                            tahap memberikan lapisan perlindungan independen dan
                            saling memperkuat.
                        </p>
                    </motion.div>

                    {/* Pipeline Overview */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={1}
                        className="rounded-lg border border-border bg-card p-5 mb-8"
                    >
                        <Pipeline
                            steps={encryptPipeline}
                            label="Alur Enkripsi"
                        />
                        <div className="border-t border-border my-4" />
                        <Pipeline
                            steps={decryptPipeline}
                            label="Alur Dekripsi"
                        />
                    </motion.div>

                    {/* Tab Buttons */}
                    <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-8 w-fit">
                        {(
                            [
                                { key: "keygen", label: "Pembangkitan Kunci" },
                                { key: "encrypt", label: "Enkripsi" },
                                { key: "decrypt", label: "Dekripsi" },
                            ] as const
                        ).map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`px-4 py-2 rounded-md font-body text-sm font-medium transition-colors ${
                                    activeTab === key
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === "keygen" && (
                            <motion.div
                                key="keygen"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                <p className="font-body text-sm text-muted-foreground mb-6 max-w-2xl">
                                    Kunci kriptografi dibangkitkan berdasarkan
                                    tiga bilangan prima. Kunci publik{" "}
                                    <span className="text-primary font-heading">
                                        (n, e)
                                    </span>{" "}
                                    digunakan untuk enkripsi, dan kunci privat{" "}
                                    <span className="text-primary font-heading">
                                        (n, d)
                                    </span>{" "}
                                    untuk dekripsi.
                                </p>
                                <div className="flex flex-col gap-4">
                                    {keygenSteps.map((step, i) => (
                                        <motion.div
                                            key={step.label}
                                            variants={fadeUp}
                                            custom={i}
                                            initial="hidden"
                                            animate="visible"
                                            className="flex gap-4 items-start"
                                        >
                                            <div className="mt-1 flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/25 text-primary flex items-center justify-center font-heading text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 rounded-lg border border-border bg-card p-4">
                                                <p className="font-heading text-xs text-muted-foreground uppercase tracking-widest mb-2">
                                                    {step.label}
                                                </p>
                                                <div
                                                    className={`font-heading text-sm mb-2 ${
                                                        step.color === "accent"
                                                            ? "text-accent"
                                                            : step.color ===
                                                                "primary"
                                                              ? "text-primary"
                                                              : "text-foreground"
                                                    }`}
                                                >
                                                    {step.formula}
                                                </div>
                                                <p className="font-body text-xs text-muted-foreground leading-relaxed">
                                                    {step.note}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-4">
                                    <p className="font-body text-xs text-muted-foreground leading-relaxed">
                                        <span className="text-accent font-medium">
                                            Output:
                                        </span>{" "}
                                        Kunci publik{" "}
                                        <span className="font-heading text-accent">
                                            (n, e)
                                        </span>{" "}
                                        untuk enkripsi & kunci privat{" "}
                                        <span className="font-heading text-accent">
                                            (n, d)
                                        </span>{" "}
                                        untuk dekripsi. Block size{" "}
                                        <span className="font-heading text-accent">
                                            k = ⌈log<sub>256</sub> n⌉
                                        </span>{" "}
                                        menentukan jumlah byte per karakter.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "encrypt" && (
                            <motion.div
                                key="encrypt"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                <p className="font-body text-sm text-muted-foreground mb-6 max-w-2xl leading-relaxed">
                                    Proses enkripsi mengubah plaintext menjadi
                                    ciphertext biner melalui empat tahap
                                    berurutan: RSA, konversi base-256, stream
                                    XOR Fibonacci feedback, dan permutasi bit.
                                </p>
                                <div className="flex flex-col gap-4">
                                    {encryptSteps.map((step, i) => (
                                        <StepCard
                                            key={step.num}
                                            step={step}
                                            index={i}
                                        />
                                    ))}
                                </div>
                                <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                                    <p className="font-body text-xs text-muted-foreground leading-relaxed">
                                        <span className="text-primary font-medium">
                                            Output:
                                        </span>{" "}
                                        String biner gabungan y<sub>1</sub>y
                                        <sub>2</sub>…y
                                        <sub>tk</sub> di mana t = jumlah
                                        karakter dan k = block size.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "decrypt" && (
                            <motion.div
                                key="decrypt"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                <p className="font-body text-sm text-muted-foreground mb-6 max-w-2xl leading-relaxed">
                                    Dekripsi membalik seluruh urutan enkripsi
                                    secara presisi: invers permutasi, XOR balik,
                                    reassembly byte, dan RSA dekripsi untuk
                                    memulihkan plaintext asli.
                                </p>
                                <div className="flex flex-col gap-4">
                                    {decryptSteps.map((step, i) => (
                                        <StepCard
                                            key={step.num}
                                            step={step}
                                            index={i}
                                        />
                                    ))}
                                </div>
                                <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                                    <p className="font-body text-xs text-muted-foreground leading-relaxed">
                                        <span className="text-primary font-medium">
                                            Output:
                                        </span>{" "}
                                        Karakter ASCII asli yang dipulihkan dari
                                        kode m<sub>i</sub> = x<sub>i</sub>
                                        <sup>d</sup> mod n untuk setiap blok.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* ── 4. Referensi Trace Log ─────────────────────────────────── */}
            <section className="py-16 px-4 border-t border-border bg-card/30">
                <div className="container max-w-5xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                            4. Referensi Trace Log
                        </h2>
                        <div className="w-10 h-0.5 bg-primary rounded mb-4" />
                        <p className="font-body text-sm text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                            Saat memproses data, sistem menampilkan trace
                            real-time yang dikategorikan dalam empat tahap
                            berikut agar pengguna dapat memantau progres secara
                            langsung.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {traceStages.map(
                            ({ icon: Icon, color, label, desc }, i) => (
                                <motion.div
                                    key={label}
                                    variants={fadeUp}
                                    custom={i}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="rounded-lg border border-border bg-card p-5 flex gap-4 items-start"
                                >
                                    <div
                                        className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-md ${
                                            color === "primary"
                                                ? "bg-primary/10 text-primary"
                                                : "bg-accent/10 text-accent"
                                        }`}
                                    >
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <h3
                                            className={`font-heading text-sm font-semibold mb-1.5 ${
                                                color === "primary"
                                                    ? "text-primary"
                                                    : "text-accent"
                                            }`}
                                        >
                                            {label}
                                        </h3>
                                        <p className="font-body text-xs text-muted-foreground leading-relaxed">
                                            {desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ),
                        )}
                    </div>

                    {/* Full system formula summary */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={4}
                        className="mt-8 rounded-lg border border-border bg-card p-6"
                    >
                        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
                            Ringkasan Formula Lengkap
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                {
                                    label: "Enkripsi RSA",
                                    color: "primary",
                                    formula: (
                                        <span>
                                            x<sub>i</sub> = m<sup>e</sup> mod n
                                        </span>
                                    ),
                                },
                                {
                                    label: "Dekripsi RSA",
                                    color: "primary",
                                    formula: (
                                        <span>
                                            m<sub>i</sub> = x<sub>i</sub>
                                            <sup>d</sup> mod n
                                        </span>
                                    ),
                                },
                                {
                                    label: "Stream Cipher (Enkripsi)",
                                    color: "accent",
                                    formula: (
                                        <span>
                                            y<sub>r</sub> = (x<sub>r</sub> ⊕ K
                                            <sub>r</sub> ⊕ y<sub>r−1</sub>) mod
                                            256
                                        </span>
                                    ),
                                },
                                {
                                    label: "Stream Cipher (Dekripsi)",
                                    color: "accent",
                                    formula: (
                                        <span>
                                            x<sub>r</sub> = (y<sub>r</sub> ⊕ K
                                            <sub>r</sub> ⊕ c<sub>r−1</sub>) mod
                                            256
                                        </span>
                                    ),
                                },
                                {
                                    label: "Fibonacci Keystream",
                                    color: "accent",
                                    formula: (
                                        <span>
                                            K<sub>r</sub> = Fib(r) mod 256, seed
                                            [1, 1]
                                        </span>
                                    ),
                                },
                                {
                                    label: "Multi-Prime Modulus",
                                    color: "primary",
                                    formula: (
                                        <span>
                                            n = p<sub>1</sub> × p<sub>2</sub> ×
                                            p<sub>3</sub>
                                        </span>
                                    ),
                                },
                            ].map(({ label, color, formula }) => (
                                <div
                                    key={label}
                                    className={`rounded-md px-3 py-2.5 border ${
                                        color === "primary"
                                            ? "bg-primary/5 border-primary/15"
                                            : "bg-accent/5 border-accent/15"
                                    }`}
                                >
                                    <p
                                        className={`font-body text-[10px] uppercase tracking-widest mb-1.5 ${
                                            color === "primary"
                                                ? "text-primary/60"
                                                : "text-accent/60"
                                        }`}
                                    >
                                        {label}
                                    </p>
                                    <p
                                        className={`font-heading text-sm ${
                                            color === "primary"
                                                ? "text-primary"
                                                : "text-accent"
                                        }`}
                                    >
                                        {formula}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            <footer className="border-t border-border py-8 text-center">
                <p className="font-body text-xs text-muted-foreground">
                    KriptoSecure — Sistem Kriptografi Multi-Prime RSA &amp;
                    Fibonacci
                </p>
            </footer>
        </div>
    );
};

export default Dokumentasi;
