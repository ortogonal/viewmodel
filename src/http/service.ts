export type ServiceErrorCode = 'VALIDATION' | 'NETWORK' | 'NOT_FOUND' | 'UNKNOWN';

export type FieldError = {
    field: string;
    message: string;
};

export interface ServiceError {
    code: ServiceErrorCode;
    message: string;
    fieldErrors?: FieldError[];
}

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: ServiceError };
