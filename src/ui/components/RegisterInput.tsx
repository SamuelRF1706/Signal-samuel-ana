import React from 'react';

interface RegisterInputProps {
    id: string;
    label: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon?: string;
    helpText?: string;
}

export const RegisterInput: React.FC<RegisterInputProps> = ({
    id,
    label,
    type,
    placeholder,
    value,
    onChange,
    icon,
    helpText
}) => {
    return (
        <div className="mb-3">
            <label htmlFor={id} className="form-label fw-semibold small text-muted">
                {label}
            </label>
            <div className={icon ? "input-group" : ""}>
                {icon && <span className="input-group-text bg-light border-end-0 text-muted rounded-start-3">{icon}</span>}
                <input 
                    type={type} 
                    className={`form-control form-control-lg rounded-3 ${icon ? "border-start-0 rounded-end-3" : ""}`} 
                    id={id}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required
                />
            </div>
            {helpText && <div className="form-text small text-muted">{helpText}</div>}
        </div>
    );
};