import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface FormData {
    name: string;
    password: string;
    user_type: string;
    expired_at: string;
}

export default function Create() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        password: '',
        user_type: 'user',
        expired_at: '',
    });

    const { toast } = useToast();

    // Format date in local timezone (YYYY-MM-DD)
    const getTodayLocal = (): string => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        post('/admin/users', {
            onSuccess: () => {
                toast({
                    title: 'Success',
                    description: 'User created successfully.',
                });
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description:
                        'Failed to create user. Please check the form.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <>
            <Head title="Create User" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/users">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Create New User
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Add a new user to the system
                        </p>
                    </div>
                </div>

                {/* Create Form */}
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
                        <CardDescription>
                            Fill in the information below to create a new user
                            account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Username{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Enter username"
                                    className={
                                        errors.name ? 'border-destructive' : ''
                                    }
                                    disabled={processing}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder="Enter password (min. 6 characters)"
                                    className={
                                        errors.password
                                            ? 'border-destructive'
                                            : ''
                                    }
                                    disabled={processing}
                                />
                                {errors.password && (
                                    <p className="text-xs text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* User Type */}
                            <div className="space-y-2">
                                <Label htmlFor="user_type">
                                    User Type{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.user_type}
                                    onValueChange={(value) =>
                                        setData('user_type', value)
                                    }
                                    disabled={processing}
                                >
                                    <SelectTrigger
                                        className={
                                            errors.user_type
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Select user type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">
                                            User
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            Admin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.user_type && (
                                    <p className="text-xs text-destructive">
                                        {errors.user_type}
                                    </p>
                                )}
                            </div>

                            {/* Expiry Date */}
                            <div className="space-y-2">
                                <Label htmlFor="expired_at">
                                    Expiry Date{' '}
                                    <span className="text-muted-foreground">
                                        (Optional)
                                    </span>
                                </Label>
                                <Input
                                    id="expired_at"
                                    type="date"
                                    value={data.expired_at}
                                    onChange={(e) =>
                                        setData('expired_at', e.target.value)
                                    }
                                    className={
                                        errors.expired_at
                                            ? 'border-destructive'
                                            : ''
                                    }
                                    disabled={processing}
                                    min={getTodayLocal()}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty for no expiration. Users cannot
                                    login after this date.
                                </p>
                                {errors.expired_at && (
                                    <p className="text-xs text-destructive">
                                        {errors.expired_at}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create User'
                                    )}
                                </Button>
                                <Link href="/admin/users">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
