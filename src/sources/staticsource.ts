import type { IQuerySource } from "./iquerysource";

export class StaticSource<Type> implements IQuerySource<Type, void>
{
    private staticData: Type[]

    constructor(data: Type[]) {
        this.staticData = data
    }

    load(_params: void): Promise<Type[]> {
        return Promise.resolve(this.staticData)
    }
}