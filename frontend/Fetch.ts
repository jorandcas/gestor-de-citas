import {isAxiosError} from "axios";

export async function catchError<T>(promise:Promise<T>):Promise<[T | null,string | null]>{
    let errorInfo;
    try {
        const data = await promise;

        return [data,null]
    }catch (error){
        if(isAxiosError(error))
            errorInfo = error.message;
        return [null,errorInfo ?? null]
    }
}