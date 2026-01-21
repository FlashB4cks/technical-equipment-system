import React from 'react';

interface StatusBadgeProps {
    status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Pending':
            case 'Active':
                return 'bg-yellow-500/20 text-yellow-300';
            case 'Diagnosing':
                return 'bg-purple-500/20 text-purple-300';
            case 'Maintenance':
                return 'bg-orange-500/20 text-orange-300';
            case 'Ready':
            case 'Completed':
            case 'Delivered':
                return 'bg-green-500/20 text-green-300';
            default:
                return 'bg-gray-500/20 text-gray-300';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'En Espera';
            case 'Active':
                return 'Activo';
            case 'Diagnosing':
                return 'Diagnosticando';
            case 'Maintenance':
                return 'En Mantenimiento';
            case 'Ready':
                return 'Listo';
            case 'Completed':
                return 'Completado';
            case 'Delivered':
                return 'Entregado';
            default:
                return status;
        }
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyles(status)}`}>
            {getStatusLabel(status)}
        </span>
    );
}
