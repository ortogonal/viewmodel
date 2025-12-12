import type { IRealtimeSource } from '../sources/irealtimesource';
import type { IQuerySource } from '../sources/iquerysource';
import { QueryViewModel } from './queryviewmodel';

export class RealtimeViewModel<Type, Params, Update> extends QueryViewModel<Type, Params> {
    private unsubscribeRealtime?: () => void;
    private readonly realtime: IRealtimeSource<Params, Update>;
    private readonly applyUpdate: (prevValue: Type[] | undefined, update: Update) => Type[];

    constructor(
        querySource: IQuerySource<Type, Params>,
        realtime: IRealtimeSource<Params, Update>,
        applyUpdate: (prevValue: Type[] | undefined, update: Update) => Type[],
    ) {
        super(querySource);
        this.realtime = realtime;
        this.applyUpdate = applyUpdate;
    }

    async start(params: Params) {
        await this.load(params);

        this.unsubscribeRealtime?.();

        this.unsubscribeRealtime = this.realtime.subscribe(params, (update) => {
            this.patch((prev) => ({
                ...prev,
                value: this.applyUpdate(prev.value, update),
            }));
        });
    }

    stop() {
        this.unsubscribeRealtime?.();
        this.unsubscribeRealtime = undefined;
    }
}
