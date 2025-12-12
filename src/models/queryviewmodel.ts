import { BaseViewModel } from './baseviewmodel';
import type { IQuerySource } from '../sources/iquerysource';

export class QueryViewModel<Type, Params> extends BaseViewModel<Type> {
    private readonly querySource: IQuerySource<Type, Params>;

    constructor(query: IQuerySource<Type, Params>) {
        super();
        this.querySource = query;
    }

    async load(params: Params) {
        this.patch((prev) => ({
            status: 'loading',
            value: prev.value,
            error: undefined,
        }));

        try {
            const value = await this.querySource.load(params);
            this.setSnapshot({ status: 'ready', value });
        } catch (error) {
            this.patch((prev) => ({
                status: 'error',
                error,
                value: prev.value,
            }));
        }
    }
}
