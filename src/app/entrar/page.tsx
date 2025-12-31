'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    ConfirmationResult,
    updateProfile
} from 'firebase/auth';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Mail, Phone, ArrowRight, Loader2, Check, Chrome } from 'lucide-react';
import Link from 'next/link';

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}

function AuthContent() {
    const { signInWithGoogle, user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [method, setMethod] = useState<'email' | 'phone'>('email');

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const m = searchParams.get('mode');
        if (m === 'signup') setMode('signup');
        else setMode('login');
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    // Setup ReCaptcha
    useEffect(() => {
        if (!window.recaptchaVerifier && method === 'phone' && !confirmationResult) {
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'normal',
                    'callback': () => { }
                });
                window.recaptchaVerifier.render();
            } catch (e) {
                console.error("Recaptcha init error", e);
            }
        }
    }, [method, confirmationResult]);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                if (name) {
                    await updateProfile(userCred.user, { displayName: name });
                }
                setSuccessMsg("Conta criada com sucesso! Redirecionando...");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                setSuccessMsg("Login realizado! Redirecionando...");
            }
        } catch (err: any) {
            console.error(err);
            setError(formatError(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!confirmationResult) {
                // Send SMS
                const formattedPhone = phone.startsWith('+') ? phone : `+55${phone.replace(/\D/g, '')}`;
                const appVerifier = window.recaptchaVerifier;
                const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
                setConfirmationResult(result);
            } else {
                // Verify OTP
                await confirmationResult.confirm(otp);
                setSuccessMsg("Autenticado! Redirecionando...");
            }
        } catch (err: any) {
            console.error(err);
            setError("Erro na verificação. Tente novamente ou use outro método.");
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.render().then((widgetId: any) => {
                    (window as any).grecaptcha.reset(widgetId);
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (e) {
            setError("Erro no Google Auth.");
        } finally {
            setLoading(false);
        }
    };

    const formatError = (code: string) => {
        switch (code) {
            case 'auth/invalid-email': return 'E-mail inválido.';
            case 'auth/user-disabled': return 'Usuário desabilitado.';
            case 'auth/user-not-found': return 'Usuário não encontrado.';
            case 'auth/wrong-password': return 'Senha incorreta.';
            case 'auth/email-already-in-use': return 'E-mail já cadastrado.';
            case 'auth/weak-password': return 'Senha muito fraca (min 6 dígitos).';
            default: return 'Ocorreu um erro. Tente novamente.';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
            <Card className="w-full max-w-md bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
                {/* Top Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />

                <CardHeader className="space-y-4 text-center pb-2">
                    <CardTitle className="text-3xl font-bold text-white tracking-tight">
                        {mode === 'login' ? 'Bem-vindo(a)' : 'Criar Conta'}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Acesse a plataforma <span className="text-emerald-400 font-semibold">LotoFoco</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Toggle */}
                    <div className="bg-slate-900 p-1 rounded-lg grid grid-cols-2 gap-1 border border-slate-800">
                        <button
                            onClick={() => setMode('login')}
                            className={`py-2 text-sm font-semibold rounded-md transition-all duration-200 ${mode === 'login'
                                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={`py-2 text-sm font-semibold rounded-md transition-all duration-200 ${mode === 'signup'
                                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Cadastrar
                        </button>
                    </div>

                    {/* Method Tabs */}
                    <div className="flex gap-4 border-b border-slate-800 pb-2">
                        <button
                            onClick={() => setMethod('email')}
                            className={`flex items-center gap-2 pb-2 text-sm transition-colors relative ${method === 'email' ? 'text-emerald-400 font-medium' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Mail className="w-4 h-4" />
                            Email e Senha
                            {method === 'email' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => setMethod('phone')}
                            className={`flex items-center gap-2 pb-2 text-sm transition-colors relative ${method === 'phone' ? 'text-emerald-400 font-medium' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Phone className="w-4 h-4" />
                            Celular
                            {method === 'phone' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />}
                        </button>
                    </div>

                    {/* Feedback */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-sm font-medium flex items-center gap-2">
                            <Check className="w-4 h-4" /> {successMsg}
                        </div>
                    )}

                    {/* Email Form */}
                    {method === 'email' && (
                        <form onSubmit={handleEmailAuth} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {mode === 'signup' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase">Nome</label>
                                    <Input
                                        type="text"
                                        placeholder="Seu nome"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-slate-900 border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-slate-600"
                                    />
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase">Email</label>
                                <Input
                                    type="email"
                                    placeholder="exemplo@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-slate-900 border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-slate-600"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase">Senha</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-slate-900 border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-slate-600"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {mode === 'login' ? 'Acessar Conta' : 'Criar Conta Grátis'}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>
                    )}

                    {/* Phone Form */}
                    {method === 'phone' && (
                        <form onSubmit={handlePhoneAuth} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {!confirmationResult ? (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-400 uppercase">Número do Celular</label>
                                        <Input
                                            type="tel"
                                            placeholder="(11) 99999-9999"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            className="bg-slate-900 border-slate-800 focus:border-emerald-500/50 text-white h-12 text-lg"
                                        />
                                    </div>
                                    <div id="recaptcha-container" className="flex justify-center bg-slate-900/50 p-2 rounded"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 bg-emerald-900/10 border border-emerald-900/30 rounded text-emerald-400 text-sm flex items-center">
                                        <Check className="w-4 h-4 mr-2" />
                                        SMS enviado para {phone}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-400 uppercase">Código de Verificação</label>
                                        <Input
                                            type="text"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                            maxLength={6}
                                            className="bg-slate-900 border-slate-800 focus:border-emerald-500/50 text-white text-center text-2xl tracking-[0.5em] h-14 font-mono"
                                        />
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {confirmationResult ? 'Confirmar Código' : 'Enviar SMS'}
                            </Button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-medium">
                            <span className="bg-slate-950 px-2 text-slate-500">Ou entre com</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white h-11"
                    >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continuar com Google
                    </Button>
                </CardContent>

                <CardFooter className="justify-center border-t border-slate-800 pt-6 pb-6">
                    <p className="text-xs text-slate-500">
                        Ao continuar, você aceita nossos <Link href="#" className="underline hover:text-emerald-400">Termos</Link> e <Link href="#" className="underline hover:text-emerald-400">Privacidade</Link>.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>}>
            <AuthContent />
        </Suspense>
    );
}
