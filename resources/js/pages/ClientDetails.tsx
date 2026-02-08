import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Users,
    Loader2,
    Plus,
    RotateCcw,
    Car,
    Building2,
    FileX,
    Trash2,
    Pencil,
} from 'lucide-react';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DataGrid } from '@/components/ui/DataGrid';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const vehicleTypes = [
    { value: 'bike', label: 'Bike' },
    { value: 'car', label: 'Car' },
    { value: 'van', label: 'Van' },
    { value: 'bus', label: 'Bus' },
    { value: 'truck', label: 'Truck' },
    { value: 'lorry', label: 'Lorry' },
];

interface Company {
    id: string;
    companyName: string;
    nickName: string;
    address: string;
    contact: string;
    vatNo: string;
}

interface Vehicle {
    id: string;
    companyId: string;
    vehicleNo: string;
    type: string;
    fuelCategory: string;
}

interface FuelCategory {
    id: number;
    name: string;
}

interface ClientDetailsProps {
    companies: Company[];
    fuelCategories: FuelCategory[];
}

const emptyCompanyForm = {
    companyName: '',
    nickName: '',
    address: '',
    contact: '',
    vatNo: '',
};

const emptyVehicleForm = {
    vehicleNo: '',
    type: '',
    fuelCategory: '',
};

export default function ClientDetails({
    companies: initialCompanies,
    fuelCategories,
}: ClientDetailsProps) {
    const { toast } = useToast();
    const { props } = usePage<{ csrf_token: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [companies, setCompanies] = useState(initialCompanies);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    // Convert fuel categories to options
    const fuelCategoryOptions = fuelCategories.map((fc) => ({
        value: String(fc.id),
        label: fc.name,
    }));

    // Selection state
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');

    // Modal states
    const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
    const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
    const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);

    // Form states
    const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
    const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
    const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
    const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

    // Delete states
    const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);
    const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null);

    const companyOptions = companies.map((c) => ({
        value: c.id,
        label: c.companyName,
    }));
    const vehicleOptions = vehicles
        .filter((v) => v.companyId === selectedCompanyId)
        .map((v) => ({ value: v.id, label: v.vehicleNo }));

    // Get vehicles for selected company
    const companyVehicles = vehicles.filter(
        (v) => v.companyId === selectedCompanyId,
    );

    const handleSaveCompany = async () => {
        if (!companyForm.companyName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Company name is required.',
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('/api/clients/store-company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    name: companyForm.companyName,
                    nick_name: companyForm.nickName,
                    address: companyForm.address,
                    contact_number: companyForm.contact,
                    vat_no: companyForm.vatNo,
                }),
            });

            const data = await response.json();

            if (data.success) {
                const newCompany: Company = {
                    id: String(data.company.id),
                    companyName: data.company.companyName,
                    nickName: data.company.nickName,
                    address: data.company.address,
                    contact: data.company.contact,
                    vatNo: data.company.vatNo,
                };

                setCompanies([...companies, newCompany]);
                toast({
                    title: 'Company Saved',
                    description: `${companyForm.companyName} has been added successfully.`,
                });
                setCompanyForm(emptyCompanyForm);
                setShowAddCompanyModal(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to save company.',
                });
            }
        } catch (error) {
            console.error('Error saving company:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save company. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditCompany = (companyId: string) => {
        const company = companies.find((c) => c.id === companyId);
        if (company) {
            setEditingCompanyId(companyId);
            setCompanyForm({
                companyName: company.companyName,
                nickName: company.nickName,
                address: company.address,
                contact: company.contact,
                vatNo: company.vatNo,
            });
            setShowEditCompanyModal(true);
        }
    };

    const handleUpdateCompany = async () => {
        if (!companyForm.companyName.trim() || !editingCompanyId) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Company name is required.',
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                `/api/clients/update-company/${editingCompanyId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                    body: JSON.stringify({
                        name: companyForm.companyName,
                        nick_name: companyForm.nickName,
                        address: companyForm.address,
                        contact_number: companyForm.contact,
                        vat_no: companyForm.vatNo,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                const updatedCompany: Company = {
                    id: String(data.company.id),
                    companyName: data.company.companyName,
                    nickName: data.company.nickName,
                    address: data.company.address,
                    contact: data.company.contact,
                    vatNo: data.company.vatNo,
                };

                setCompanies(
                    companies.map((c) =>
                        c.id === editingCompanyId ? updatedCompany : c
                    )
                );
                toast({
                    title: 'Company Updated',
                    description: `${companyForm.companyName} has been updated successfully.`,
                });
                setCompanyForm(emptyCompanyForm);
                setEditingCompanyId(null);
                setShowEditCompanyModal(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to update company.',
                });
            }
        } catch (error) {
            console.error('Error updating company:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update company. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveVehicle = async () => {
        if (!selectedCompanyId) {
            toast({
                title: 'Select Company',
                description: 'Please select a company first.',
                variant: 'destructive',
            });
            return;
        }

        if (
            !vehicleForm.vehicleNo.trim() ||
            !vehicleForm.type ||
            !vehicleForm.fuelCategory
        ) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'All fields are required.',
            });
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch('/api/clients/store-vehicle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                },
                body: JSON.stringify({
                    company_id: selectedCompanyId,
                    vehicle_no: vehicleForm.vehicleNo,
                    type: vehicleForm.type,
                    fuel_category_id: vehicleForm.fuelCategory,
                }),
            });

            const data = await response.json();

            if (data.success) {
                const newVehicle: Vehicle = {
                    id: String(data.vehicle.id),
                    companyId: String(data.vehicle.companyId),
                    vehicleNo: data.vehicle.vehicleNo,
                    type: data.vehicle.type,
                    fuelCategory: data.vehicle.fuelCategory,
                };

                setVehicles([...vehicles, newVehicle]);
                toast({
                    title: 'Vehicle Saved',
                    description: `${vehicleForm.vehicleNo} has been added successfully.`,
                });
                setVehicleForm(emptyVehicleForm);
                setShowAddVehicleModal(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to save vehicle.',
                });
            }
        } catch (error) {
            console.error('Error saving vehicle:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save vehicle. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditVehicle = (vehicleId: string) => {
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        if (vehicle) {
            setEditingVehicleId(vehicleId);
            setVehicleForm({
                vehicleNo: vehicle.vehicleNo,
                type: vehicle.type,
                fuelCategory: String(
                    fuelCategories.find((fc) => fc.name === vehicle.fuelCategory)?.id || ''
                ),
            });
            // Store the original company ID for editing
            setSelectedCompanyId(vehicle.companyId);
            setShowEditVehicleModal(true);
        }
    };

    const handleUpdateVehicle = async () => {
        if (
            !vehicleForm.vehicleNo.trim() ||
            !vehicleForm.type ||
            !vehicleForm.fuelCategory ||
            !editingVehicleId ||
            !selectedCompanyId
        ) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'All fields are required.',
            });
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(
                `/api/clients/update-vehicle/${editingVehicleId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                    body: JSON.stringify({
                        company_id: selectedCompanyId,
                        vehicle_no: vehicleForm.vehicleNo,
                        type: vehicleForm.type,
                        fuel_category_id: vehicleForm.fuelCategory,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                const updatedVehicle: Vehicle = {
                    id: String(data.vehicle.id),
                    companyId: String(data.vehicle.companyId),
                    vehicleNo: data.vehicle.vehicleNo,
                    type: data.vehicle.type,
                    fuelCategory: data.vehicle.fuelCategory,
                };

                setVehicles(
                    vehicles.map((v) =>
                        v.id === editingVehicleId ? updatedVehicle : v
                    )
                );
                toast({
                    title: 'Vehicle Updated',
                    description: `${vehicleForm.vehicleNo} has been updated successfully.`,
                });
                setVehicleForm(emptyVehicleForm);
                setEditingVehicleId(null);
                setShowEditVehicleModal(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to update vehicle.',
                });
            }
        } catch (error) {
            console.error('Error updating vehicle:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update vehicle. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearCompany = () => {
        setSelectedCompanyId('');
        setSelectedVehicle('');
        setVehicles([]);
    };

    // Fetch vehicles when company is selected
    useEffect(() => {
        if (selectedCompanyId) {
            const fetchVehicles = async () => {
                try {
                    setIsLoading(true);
                    const response = await fetch('/api/clients/vehicles', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': props.csrf_token,
                        },
                        body: JSON.stringify({ company_id: selectedCompanyId }),
                    });

                    const data = await response.json();
                    if (data.success) {
                        setVehicles(data.vehicles);
                    } else {
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Failed to fetch vehicles',
                        });
                    }
                } catch (error) {
                    console.error('Error fetching vehicles:', error);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to fetch vehicles',
                    });
                } finally {
                    setIsLoading(false);
                }
            };

            fetchVehicles();
        } else {
            setVehicles([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCompanyId]);

    const handleDeleteCompany = async () => {
        if (!deleteCompanyId) return;

        try {
            setIsLoading(true);

            const response = await fetch(
                `/api/clients/delete-company/${deleteCompanyId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                },
            );

            const data = await response.json();

            if (data.success) {
                setCompanies(companies.filter((c) => c.id !== deleteCompanyId));
                setVehicles(
                    vehicles.filter((v) => v.companyId !== deleteCompanyId),
                );

                if (selectedCompanyId === deleteCompanyId) {
                    setSelectedCompanyId('');
                    setSelectedVehicle('');
                }

                toast({
                    title: 'Company Deleted',
                    description:
                        'The company and its vehicles have been successfully deleted.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to delete company.',
                });
            }
        } catch (error) {
            console.error('Error deleting company:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete company. Please try again.',
            });
        } finally {
            setIsLoading(false);
            setDeleteCompanyId(null);
        }
    };

    const handleDeleteVehicle = async () => {
        if (!deleteVehicleId) return;

        try {
            setIsLoading(true);

            const response = await fetch(
                `/api/clients/delete-vehicle/${deleteVehicleId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': props.csrf_token,
                    },
                },
            );

            const data = await response.json();

            if (data.success) {
                setVehicles(vehicles.filter((v) => v.id !== deleteVehicleId));

                if (selectedVehicle === deleteVehicleId) {
                    setSelectedVehicle('');
                }

                toast({
                    title: 'Vehicle Deleted',
                    description: 'The vehicle has been successfully deleted.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: data.message || 'Failed to delete vehicle.',
                });
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete vehicle. Please try again.',
            });
        } finally {
            setIsLoading(false);
            setDeleteVehicleId(null);
        }
    };

    const vehicleColumns = [
        { key: 'vehicleNo', header: 'Vehicle No', sortable: true },
        { key: 'type', header: 'Type' },
        { key: 'fuelCategory', header: 'Fuel Category' },
        {
            key: 'actions',
            header: 'Actions',
            align: 'center' as const,
            render: (row: Vehicle) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditVehicle(row.id);
                        }}
                        title="Edit Vehicle"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteVehicleId(row.id);
                        }}
                        title="Delete Vehicle"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="animate-fade-slide-up">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                            Client Details
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage company and vehicle master data
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Section */}
                <div className="card-neumorphic-elevated p-6 space-y-6 animate-card-entrance">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold text-foreground">
                                Company
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddCompanyModal(true)}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Add New Company"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    <SearchableSelect
                        label="Company Name"
                        options={companyOptions}
                        value={selectedCompanyId}
                        onChange={(value) => {
                            setSelectedCompanyId(value);
                            setSelectedVehicle('');
                        }}
                        placeholder="Select a company"
                    />

                    {selectedCompanyId &&
                        (() => {
                            const company = companies.find(
                                (c) => c.id === selectedCompanyId,
                            );
                            return company ? (
                                <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Nick Name
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {company.nickName || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Address
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {company.address}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Contact
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {company.contact}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            VAT No
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {company.vatNo}
                                        </p>
                                    </div>
                                </div>
                            ) : null;
                        })()}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClearCompany}
                            className="btn-ghost flex items-center gap-2"
                            disabled={!selectedCompanyId}
                        >
                            <RotateCcw className="h-4 w-4" />
                            Clear
                        </button>

                        <button
                            type="button"
                            onClick={() => handleEditCompany(selectedCompanyId)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedCompanyId}
                        >
                            <Pencil className="h-4 w-4" />
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setDeleteCompanyId(selectedCompanyId)
                            }
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedCompanyId}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Vehicle Section */}
                <div
                    className="card-neumorphic-elevated p-6 space-y-6 animate-card-entrance"
                    style={{ animationDelay: '0.1s' }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold text-foreground">
                                Vehicle
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (!selectedCompanyId) {
                                    toast({
                                        title: 'Select Company',
                                        description:
                                            'Please select a company first to add a vehicle.',
                                        variant: 'destructive',
                                    });
                                    return;
                                }
                                setShowAddVehicleModal(true);
                            }}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Add New Vehicle"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    <SearchableSelect
                        label="Vehicle No"
                        options={vehicleOptions}
                        value={selectedVehicle}
                        onChange={setSelectedVehicle}
                        placeholder={
                            selectedCompanyId
                                ? 'Select a vehicle'
                                : 'Select company first'
                        }
                    />

                    {selectedVehicle &&
                        (() => {
                            const vehicle = vehicles.find(
                                (v) => v.id === selectedVehicle,
                            );
                            return vehicle ? (
                                <div className="bg-accent/10 rounded-xl p-4 space-y-3">
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Type
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {vehicle.type}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Fuel Category
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {vehicle.fuelCategory}
                                        </p>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                </div>
            </div>

            {/* Vehicle List */}
            <div
                className="animate-fade-slide-up"
                style={{ animationDelay: '0.2s' }}
            >
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Vehicle List
                </h2>
                {!selectedCompanyId ? (
                    <div className="card-neumorphic p-12 text-center">
                        <FileX className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Select a Company
                        </h3>
                        <p className="text-muted-foreground">
                            Select a company to view its vehicles.
                        </p>
                    </div>
                ) : companyVehicles.length === 0 ? (
                    <div className="card-neumorphic p-12 text-center">
                        <Car className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No Vehicles
                        </h3>
                        <p className="text-muted-foreground">
                            This company has no vehicles. Add one to get
                            started.
                        </p>
                    </div>
                ) : (
                    <DataGrid
                        columns={vehicleColumns}
                        data={companyVehicles}
                        pageSize={15}
                    />
                )}
            </div>

            {/* Add Company Modal */}
            <Dialog
                open={showAddCompanyModal}
                onOpenChange={setShowAddCompanyModal}
            >
                <DialogContent className="card-neumorphic-elevated border-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Add New Company
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <FloatingInput
                            label="Company Name"
                            value={companyForm.companyName}
                            onChange={(e) =>
                                setCompanyForm({
                                    ...companyForm,
                                    companyName: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Nick Name"
                            value={companyForm.nickName}
                            onChange={(e) =>
                                setCompanyForm({
                                    ...companyForm,
                                    nickName: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Address"
                            value={companyForm.address}
                            onChange={(e) =>
                                setCompanyForm({
                                    ...companyForm,
                                    address: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Contact Number"
                            type="tel"
                            value={companyForm.contact}
                            onChange={(e) =>
                                setCompanyForm({
                                    ...companyForm,
                                    contact: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="VAT No"
                            value={companyForm.vatNo}
                            onChange={(e) =>
                                setCompanyForm({
                                    ...companyForm,
                                    vatNo: e.target.value,
                                })
                            }
                        />
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddCompanyModal(false);
                                    setCompanyForm(emptyCompanyForm);
                                }}
                                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveCompany}
                                disabled={isLoading || !companyForm.companyName}
                                className="btn-primary-glow flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                Add Company
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Vehicle Modal */}
            <Dialog
                open={showAddVehicleModal}
                onOpenChange={setShowAddVehicleModal}
            >
                <DialogContent className="card-neumorphic-elevated border-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-accent" />
                            Add New Vehicle
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <FloatingInput
                            label="Vehicle No"
                            value={vehicleForm.vehicleNo}
                            onChange={(e) =>
                                setVehicleForm({
                                    ...vehicleForm,
                                    vehicleNo: e.target.value,
                                })
                            }
                        />
                        <SearchableSelect
                            label="Type"
                            options={vehicleTypes}
                            value={vehicleForm.type}
                            onChange={(value) =>
                                setVehicleForm({ ...vehicleForm, type: value })
                            }
                            placeholder="Select vehicle type"
                        />
                        <SearchableSelect
                            label="Fuel Category"
                            options={fuelCategoryOptions}
                            value={vehicleForm.fuelCategory}
                            onChange={(value) =>
                                setVehicleForm({
                                    ...vehicleForm,
                                    fuelCategory: value,
                                })
                            }
                            placeholder="Select fuel category"
                        />
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddVehicleModal(false);
                                    setVehicleForm(emptyVehicleForm);
                                }}
                                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveVehicle}
                                disabled={
                                    isLoading ||
                                    !vehicleForm.vehicleNo ||
                                    !vehicleForm.type ||
                                    !vehicleForm.fuelCategory
                                }
                                className="btn-primary-glow flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                Add Vehicle
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Company Modal */}
            <Dialog
                open={showEditCompanyModal}
                onOpenChange={setShowEditCompanyModal}
            >
                <DialogContent className="card-neumorphic-elevated border-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-primary" />
                            Edit Company
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <FloatingInput
                            label="Company Name"
                            value={companyForm.companyName}
                            onChange={(e) =>
                                setCompanyForm({
                                    ...companyForm,
                                    companyName: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Nick Name"
                            value={companyForm.nickName}
                            onChange={(e) =>
                                setCompanyForm({
                                    ...companyForm,
                                    nickName: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Address"
                            value={companyForm.address}
                            onChange={(e) =>
                                setCompanyForm({
                                    ...companyForm,
                                    address: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="Contact Number"
                            type="tel"
                            value={companyForm.contact}
                            onChange={(e) =>
                                setCompanyForm({
                                    ...companyForm,
                                    contact: e.target.value,
                                })
                            }
                        />
                        <FloatingInput
                            label="VAT No"
                            value={companyForm.vatNo}
                            onChange={(e) =>
                                setCompanyForm({
                                    ...companyForm,
                                    vatNo: e.target.value,
                                })
                            }
                        />
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditCompanyModal(false);
                                    setCompanyForm(emptyCompanyForm);
                                    setEditingCompanyId(null);
                                }}
                                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateCompany}
                                disabled={isLoading || !companyForm.companyName}
                                className="btn-primary-glow flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Pencil className="h-4 w-4" />
                                )}
                                Update Company
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Vehicle Modal */}
            <Dialog
                open={showEditVehicleModal}
                onOpenChange={setShowEditVehicleModal}
            >
                <DialogContent className="card-neumorphic-elevated border-none max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-accent" />
                            Edit Vehicle
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <SearchableSelect
                            label="Company"
                            options={companyOptions}
                            value={selectedCompanyId}
                            onChange={(value) => setSelectedCompanyId(value)}
                            placeholder="Select company"
                        />
                        <FloatingInput
                            label="Vehicle No"
                            value={vehicleForm.vehicleNo}
                            onChange={(e) =>
                                setVehicleForm({
                                    ...vehicleForm,
                                    vehicleNo: e.target.value,
                                })
                            }
                        />
                        <SearchableSelect
                            label="Type"
                            options={vehicleTypes}
                            value={vehicleForm.type}
                            onChange={(value) =>
                                setVehicleForm({ ...vehicleForm, type: value })
                            }
                            placeholder="Select vehicle type"
                        />
                        <SearchableSelect
                            label="Fuel Category"
                            options={fuelCategoryOptions}
                            value={vehicleForm.fuelCategory}
                            onChange={(value) =>
                                setVehicleForm({
                                    ...vehicleForm,
                                    fuelCategory: value,
                                })
                            }
                            placeholder="Select fuel category"
                        />
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditVehicleModal(false);
                                    setVehicleForm(emptyVehicleForm);
                                    setEditingVehicleId(null);
                                }}
                                className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateVehicle}
                                disabled={
                                    isLoading ||
                                    !vehicleForm.vehicleNo ||
                                    !vehicleForm.type ||
                                    !vehicleForm.fuelCategory
                                }
                                className="btn-primary-glow flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Pencil className="h-4 w-4" />
                                )}
                                Update Vehicle
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Company Confirmation */}
            <AlertDialog
                open={!!deleteCompanyId}
                onOpenChange={() => setDeleteCompanyId(null)}
            >
                <AlertDialogContent className="card-neumorphic-elevated border-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Company?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this company? This
                            will also delete all associated vehicles. This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCompany}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Vehicle Confirmation */}
            <AlertDialog
                open={!!deleteVehicleId}
                onOpenChange={() => setDeleteVehicleId(null)}
            >
                <AlertDialogContent className="card-neumorphic-elevated border-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this vehicle? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteVehicle}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
