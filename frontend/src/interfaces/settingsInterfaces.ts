
export interface Config {
    id: number;
    key: string;
    value: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConfigsResponse {
    status: string;
    configs: Config[];
}
interface Currency {
    id: number;
    code: string;
    value:string
    name: string;
    symbol: string;
    decimal_places: number;
    is_active: boolean;
    is_default: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CurrenciesResponse {
    status: string;
        currencies: Currency[];

}
