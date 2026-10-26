import axios, { type AxiosRequestConfig } from 'axios';
import { getToken } from '../utils/token';


export class ApiError extends Error {
    status: number;
    code?:string;

    constructor(message: string, status: number,code?:string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code=code;
    }
}


const API_URL = import.meta.env.VITE_API_URL;

async function apiRequest(path: string, options?: AxiosRequestConfig) {
    const url = API_URL + path;
    const token=getToken();
    const headers={
        ...options?.headers,
        ...(token && {Authorization:`Bearer ${token}`}),
    }
    const newOption={
        ...options,
        headers
    }

    try {
        
        const response = await axios(url, newOption);
        return response.data

    } catch (error) {

        if (axios.isAxiosError(error)) {

            if (error.response) {

                throw new ApiError(
                   error.response.data?.error?.message??"אירעה שגיאה",
                    error.response.status,
                    error.response.data?.error?.code  
                   
                )

            }
            else {
                throw new ApiError(
                    "בעיה בחיבור לשרת",
                    0,
                    error.code
                )

            }
        }
        else {
            throw error            
        }
    }

}


export default apiRequest