export type RealtimeUpdate<Type> =
    | { operation: 'add'; value: Type }
    | { operation: 'update'; uniqueId: string; value: Type }
    | { operation: 'delete'; uniqueId: string }
    | { operation: 'batch'; operations: RealtimeUpdate<Type>[] };
