/**
 * @author k8w
 * email: me@k8w.io
 */

import 'core-js/es/promise/finally';

export class SuperPromise<T, TError = never> implements Promise<T>{

    readonly [Symbol.toStringTag] = 'SuperPromise';

    protected _promise: Promise<any>;

    /** have been rs or rj */
    isCompleted: boolean = false;
    isAborted: boolean = false;

    constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason: any) => void) => void) {
        this._promise = new Promise<T>((rs, rj) => {
            //重新定义resolve
            let newRs = (value: T | PromiseLike<T>) => {
                if (this.isAborted) {
                    return;
                }
                this.isCompleted = true;
                rs(value);
            }
            //重新定义reject
            let newRj = (err: TError) => {
                if (this.isAborted) {
                    return;
                }
                this.isCompleted = true;
                rj(err);
            }
            executor(newRs, newRj);
        });
    }

    /**
     * Abort event
     * @param handler 
     */
    onAbort?: () => void;

    /**
     * 立即取消该Promise
     * 如果取消成功或之前已经取消，则返回true
     * 如果取消失败（已经resolve或reject），则返回false
     */
    abort(): boolean {
        if (this.isCompleted) {
            return false;
        }

        if (this.isAborted) {
            return true;
        }

        //abort handler
        this.isAborted = true;
        this.onAbort?.();
        return true;
    }

    then<TResult1 = T, TResult2 = TError>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): SuperPromise<TResult1, TResult2> {
        this._promise = this._promise.then(onfulfilled, onrejected);
        return this as SuperPromise<any>;
    }

    catch<TResult = TError>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): SuperPromise<T | TResult> {
        this._promise = this._promise.catch(onrejected);
        return this as SuperPromise<any>;
    }

    finally(onfinally?: (() => void) | undefined | null): SuperPromise<T> {
        this._promise = this._promise.finally(onfinally);
        return this as SuperPromise<any>;
    }
}