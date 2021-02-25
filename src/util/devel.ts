import { log } from './log';

import Promise from 'bluebird';

/**
 * downloads and installs development extensions that help with redux / react development.
 * These are chrome extensions and thus appear in the development tools
 *
 * @export
 * @returns
 */
export function installDevelExtensions(): Promise<void> {
  return new Promise<void>((resolved, reject) => {
    if (process.env.NODE_ENV === 'development') {
      const installExtension = require('electron-devtools-installer').default;
      const {
        REACT_DEVELOPER_TOOLS,
        REACT_PERF,
        REDUX_DEVTOOLS } = require('electron-devtools-installer');

      try {
        installExtension(REACT_DEVELOPER_TOOLS.id, { allowFileAccess: true })
          .then((name) => log('info', 'Added Extension', name))
          .catch((err) => log('error', 'An error occurred: ', { error: err.message }));

        installExtension(REACT_PERF.id, { allowFileAccess: true })
          .then((name) => log('info', 'Added Extension', name))
          .catch((err) => log('error', 'An error occurred: ', { error: err.message }));

        installExtension(REDUX_DEVTOOLS.id, { allowFileAccess: true })
          .then((name) => log('info', 'Added Extension', name))
          .catch((err) => log('error', 'An error occurred: ', { error: err.message }));
      } catch (e) {
        // tslint:disable-next-line:no-console
        console.error(e);
      }
    }
    resolved();
  });
}
