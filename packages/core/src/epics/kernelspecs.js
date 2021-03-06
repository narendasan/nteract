// @flow
import * as actionTypes from "../actionTypes";
import * as actions from "../actions";
import { catchError, map, mergeMap } from "rxjs/operators";
import { kernelspecs } from "rx-jupyter";
import { of } from "rxjs/observable/of";
import { ofType } from "redux-observable";
import type { ActionsObservable } from "redux-observable";
import type { KernelspecProps, Kernelspecs } from "@nteract/types/core/records";

import * as selectors from "../selectors";

export const fetchKernelspecsEpic = (
  action$: ActionsObservable<*>,
  store: any
) =>
  action$.pipe(
    ofType(actionTypes.FETCH_KERNELSPECS),
    mergeMap(({ payload: { kernelspecsRef } }) => {
      const serverConfig = selectors.serverConfig(store.getState());
      // $FlowFixMe: this should be ok, once rebased this should work out
      return kernelspecs.list(serverConfig).pipe(
        map(data => {
          const defaultKernelName = data.response.default;
          const kernelspecs = {};
          Object.keys(data.response.kernelspecs).forEach(key => {
            const value = data.response.kernelspecs[key];
            kernelspecs[key] = {
              name: value.name,
              resources: value.resources,
              ...value.spec
            };
          });
          return actions.fetchKernelspecsFulfilled({
            kernelspecsRef,
            defaultKernelName,
            kernelspecs
          });
        }),
        catchError(error => {
          return actions.fetchKernelspecsFailed({ kernelspecsRef, error });
        })
      );
    })
  );
