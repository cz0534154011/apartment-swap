
import { createContext, useContext, useState, useEffect } from "react";
import { type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { login as loginApi, register as registerApi, getMe as getMeApi } from "../api/auth";
import { type User, type LoginData, type RegisterData } from "../api/auth"
import { getToken, saveToken, removeToken } from "../utils/token";

export type AuthContextValue = {
    user: User | null;
    hasApartment: boolean;
    isLoading: boolean;
    login: (data: LoginData) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    refreshMe: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [hasApartment, setHasApartment] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const queryClient = useQueryClient();

    async function refreshMe(): Promise<void> {
        const response = await getMeApi();
        setUser(response.user);
        setHasApartment(response.hasApartment);
    }
    useEffect(() => {
        if (getToken() === null) {
            setIsLoading(false);
            return;
        }
        refreshMe().catch(() => {
            removeToken();
        }).finally(() => {
            setIsLoading(false);
        })

    }, [])
    async function login(data:LoginData):Promise<void> {
        const response =await loginApi(data);
        saveToken(response.token);
        await refreshMe();
    }
    async function register(data:RegisterData):Promise<void> {
        const response=await registerApi(data);
        saveToken(response.token);
        setUser(response.user);
        setHasApartment(false);
    }
    function logout(){
        removeToken();
        setUser(null);
        setHasApartment(false);
        queryClient.clear();
    }
    return(
       <AuthContext.Provider
       value={{
        user,
        hasApartment,
        isLoading,
        login,
        register,
        logout,
        refreshMe
       }}
       >
        {children}
       </AuthContext.Provider>
    )

}
export function useAuth(){
    const context=useContext(AuthContext)
    if(context===undefined){
        throw new Error("useAuth חייב להיות בתוך AuthProvider")
    }
    return context;
}