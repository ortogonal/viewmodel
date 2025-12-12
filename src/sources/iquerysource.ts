export interface IQuerySource<Type, Params> {
    load(params: Params): Promise<Type[]>;
}
