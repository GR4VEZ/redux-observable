import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { from } from 'rxjs/observable/from';
import { switchMap } from 'rxjs/operator/switchMap';
import { ActionsObservable } from './ActionsObservable';
import { EPIC_END } from './EPIC_END';

const defaultAdapter = {
  input: action$ => action$,
  output: action$ => action$
};

const defaultOptions = {
  adapter: defaultAdapter
};

export function createEpicMiddleware(epic, { adapter = defaultAdapter } = defaultOptions) {
  const input$ = new Subject();
  const action$ = adapter.input(
    new ActionsObservable(input$)
  );
  const epic$ = new BehaviorSubject(epic);
  let store;

  const epicMiddleware = _store => {
    store = _store;

    return next => {
      if (typeof epic === 'function') {
        epic$::switchMap(epic => adapter.output(epic(action$, store)))
          .subscribe(store.dispatch);
      }

      return action => {
        if (typeof action === 'function') {
          if (typeof console !== 'undefined' && typeof console.warn !== 'undefined') {
            console.warn('DEPRECATION: Using thunkservables with redux-observable is now deprecated in favor of the new "Epics" feature. See http://redux-observable.js.org/docs/FAQ.html#why-were-thunkservables-deprecated');
          }

          const out$ = from(action(action$, store));
          return out$.subscribe(store.dispatch);
        } else {
          const result = next(action);
          input$.next(action);
          return result;
        }
      };
    };
  };

  epicMiddleware.replaceEpic = epic => {
    store.dispatch({ type: EPIC_END });
    epic$.next(epic);
  };

  return epicMiddleware;
}
