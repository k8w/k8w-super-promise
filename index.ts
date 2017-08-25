export default class SuperPromise<T>{
    private _promise: Promise<any>;
    private _isDone: boolean = false;
    private _isCanceled: boolean = false;
    private _alwaysFunc: (() => void)[] = [];

    constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
        this._promise = new Promise<T>((rs, rj) => {
            //重新定义resolve
            let resolve = (value: T) => {
                //Cancelable
                if (this._isCanceled) {
                    return;
                }

                this._isDone = true;

                //Always Call
                this._alwaysFunc.forEach(v => { v.call(this) });

                return rs(value);
            }
            //重新定义reject
            let reject = (err: Error) => {
                //Cancelable
                if (this._isCanceled) {
                    return;
                }

                this._isDone = true;

                //Always Call
                this._alwaysFunc.forEach(v => { v.call(this) });

                return rj(err);
            }
            executor(resolve, reject);
        });
    }

    public get isCanceled(): boolean {
        return this._isCanceled;
    }

    public get isDone(): boolean {
        return this._isDone;
    }

    onCancel: () => void;
    cancel() {
        if (this._isCanceled) {
            return;
        }

        this._isCanceled = true;
        this.onCancel && this.onCancel();
        (this._promise as any) = null;
    }

    always(func: () => void): this {
        if (this._isCanceled) {
            //Do nothing
        }
        else if (this._isDone) {
            func.call(this);
        }
        else {
            this._alwaysFunc.push(func);
        }
        return this;
    }

    then(onfulfilled?: ((value: T) => T | PromiseLike<T>) | undefined | null, onrejected?: ((reason: any) => T | PromiseLike<T>) | undefined | null): SuperPromise<T>;
    then<TResult>(onfulfilled: ((value: T) => T | PromiseLike<T>) | undefined | null, onrejected: (reason: any) => TResult | PromiseLike<TResult>): SuperPromise<T | TResult>;
    then<TResult>(onfulfilled: (value: T) => TResult | PromiseLike<TResult>, onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): SuperPromise<TResult>;
    then<TResult1, TResult2>(onfulfilled: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected: (reason: any) => TResult2 | PromiseLike<TResult2>): SuperPromise<TResult1 | TResult2>;
    then(onfulfilled: any, onrejected: any) {
        if (!this._isCanceled) {
            this._promise = this._promise.then(onfulfilled, onrejected);
        }
        return this;
    }

    catch(onrejected?: (err: Error) => any): SuperPromise<any>;
    catch<TResult>(onrejected: (err: Error) => TResult | PromiseLike<TResult>): SuperPromise<TResult>;
    catch(onrejected: any) {
        if (!this._isCanceled) {
            this._promise = this._promise.catch(onrejected);
        }
        return this;
    }

    static all<T>(promises: SuperPromise<T>[]): SuperPromise<T[]> {
        let output = new SuperPromise<T[]>((rs, rj) => {
            Promise.all(promises).then(result => {
                rs(result);
            }).catch(err => {
                rj(err);
            })
        });

        output.onCancel = function () {
            promises.forEach(promise => {
                promise.cancel();
            })
        };

        return output;
    }
}