import type { RealtimeUpdate } from '../sources/irealtimeupdate';

export const makeApplyUpdate =
    <Type>(getId: (item: Type) => string) =>
    (prev: Type[] | undefined, update: RealtimeUpdate<Type>): Type[] => {
        const current = prev ?? [];

        const apply = (state: Type[] | undefined, op: RealtimeUpdate<Type>): Type[] => {
            const snapshot = state ?? [];

            switch (op.operation) {
                case 'add':
                    return [...snapshot, op.value];
                case 'update':
                    return snapshot.map((item) => (getId(item) === op.uniqueId ? op.value : item));
                case 'delete':
                    return snapshot.filter((item) => getId(item) !== op.uniqueId);
                case 'batch':
                    return op.operations.reduce((acc, nested) => apply(acc, nested), snapshot);
                default:
                    return snapshot;
            }
        };

        return apply(current, update);
    };
