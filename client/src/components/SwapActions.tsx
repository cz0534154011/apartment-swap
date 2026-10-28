import { useQueryClient, useMutation } from "@tanstack/react-query";
import { swapAction,requestCancel, type Swap, type SwapActionName } from "../api/swaps";
import { useState } from "react";
import FormField from "./FormField";

const SWAP_BUTTONS = [
    {
        action: "approve",
        allowedKey: "canApprove",
        label: "אישור ההצעה",
        className: "btn btn--primary"
    },
    {
        action: "reject",
        allowedKey: "canReject",
        label: "דחיית ההצעה",
        className: "btn btn--danger"
    },
    {
        action: "withdraw",
        allowedKey: "canWithdraw",
        label: "משיכת ההצעה",
        className: "btn btn--danger"
    },
    {
        action: "cancel-request/approve",
        allowedKey: "canApproveCancel",
        label: "הסכמה לביטול",
        className: "btn btn--danger"
    },
    {
        action: "cancel-request/reject",
        allowedKey: "canRejectCancel",
        label: "סירוב לביטול",
        className: "btn btn--secondary"
    },
    {
        action: "cancel-request/withdraw",
        allowedKey: "canWithdrawCancelRequest",
        label: "משיכת בקשת הביטול",
        className: "btn btn--secondary"
    },
] as const

export type SwapActionsProps = {
    swap: Swap;
}

function SwapActions({ swap }: SwapActionsProps) {
    const queryClient = useQueryClient()
    const [reason,setReason]=useState("");
    const { mutate: runAction,
        isPending: actionPending,
        error: actionError
    } = useMutation({
        mutationFn: (action: SwapActionName) => swapAction(swap.id, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["swap", swap.id] });
            queryClient.invalidateQueries({ queryKey: ["swaps"] });
            queryClient.invalidateQueries({ queryKey: ["calendar"] });
        }
    })

     const { mutate: sendCancelRequest,
        isPending: cancelPending,
        error: cancelError
    } = useMutation({
        mutationFn: ()=>requestCancel(swap.id,reason||undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["swap", swap.id] });
            queryClient.invalidateQueries({ queryKey: ["swaps"] });
            queryClient.invalidateQueries({ queryKey: ["calendar"] });
        }
    })

    return (
        <>
            {actionError &&
                <div className="alert alert--error">
                    <p className="alert__text">{actionError.message}</p>
                </div>
            }
            <div className="btn-group">
                {SWAP_BUTTONS.map((button) => swap.allowedActions[button.allowedKey] &&
                    <button key={button.action} className={button.className}
                        type="button" disabled={actionPending} onClick={() => runAction(button.action)}
                    >{button.label}</button>)}
            </div >
            {swap.allowedActions.canRequestCancel &&
                <div className="form">
                    <FormField id="cancelReason" label="סיבת הביטול (לא חובה)">
                        <textarea className="field__input"
                         id="cancelReason"
                         rows={3} maxLength={300} value={reason}
                         onChange={(e)=>setReason(e.target.value)}
                         ></textarea>
                    </FormField>
                    <button className="btn btn--danger"
                    type="button" disabled={cancelPending} 
                    onClick={()=>sendCancelRequest}
                    >בקשת ביטול ההחלפה</button>
                </div>
            }
        </>
    )

}
export default SwapActions

