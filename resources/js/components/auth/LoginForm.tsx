import * as React from 'react';
import { User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useForm } from '@inertiajs/react';

interface FormData {
    name: string;
    password: string;
    remember: boolean;
}

export function LoginForm() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        password: '',
        remember: false,
    });

    const { toast } = useToast();
    const [hasNameValue, setHasNameValue] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/login', {
            onSuccess: () => {
                toast({
                    title: 'Success',
                    description: 'You have been logged in successfully.',
                });
            },
            onError: () => {
                // Check for specific error messages
                const errorMessage =
                    errors.name ||
                    errors.password ||
                    'Login failed. Please try again.';
                toast({
                    title: 'Login Failed',
                    description: errorMessage,
                    variant: 'destructive',
                });
            },
        });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData('name', e.target.value);
        setHasNameValue(e.target.value !== '');
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData('password', e.target.value);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div className="space-y-1">
                <div className="floating-input-wrapper group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <User className="h-4 w-4" />
                    </div>
                    <input
                        type="text"
                        value={data.name}
                        onChange={handleNameChange}
                        className={cn(
                            'floating-input peer pl-11',
                            hasNameValue && 'has-value',
                            errors.name &&
                                'border-destructive focus:border-destructive focus:ring-destructive/20',
                        )}
                        placeholder=" "
                        disabled={processing}
                        autoComplete="username"
                    />
                    <label className="floating-label left-11">Username</label>
                </div>
                {errors.name && (
                    <p className="text-xs text-destructive pl-1">
                        {errors.name}
                    </p>
                )}
            </div>

            {/* Password Input */}
            <PasswordInput
                label="Password"
                value={data.password}
                onChange={handlePasswordChange}
                error={errors.password}
                disabled={processing}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="remember"
                        checked={data.remember}
                        onCheckedChange={(checked) =>
                            setData('remember', checked as boolean)
                        }
                        disabled={processing}
                    />
                    <label
                        htmlFor="remember"
                        className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                        Remember me
                    </label>
                </div>
                <a
                    href="#"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    Forgot password?
                </a>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={processing}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
                {processing ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Signing in...
                    </>
                ) : (
                    'Sign In'
                )}
            </Button>
        </form>
    );
}
