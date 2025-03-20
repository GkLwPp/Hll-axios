/*
 * The MIT License (MIT)
 * Copyright (C) 2023 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */
'use strict';

import settle from '../../../../lib/core/settle';
import AxiosError from '../../../../lib/core/AxiosError';
import fs from '@ohos.file.fs';

function download(httpConfig, resolve, reject) {
    const { session, request, config } = httpConfig;
    try {
        let path = '';
        let cacheDir = '';
        let filePath = config.filePath;
        if (config.context) {
            cacheDir = config.context.cacheDir;
            path = config.filePath.indexOf(cacheDir) > -1 ? filePath : `${cacheDir}/${filePath}`;
        } else {
            if (filePath.indexOf(part) === -1) {
                return reject(new AxiosError('If there is no context, the filePath must be a complete fd path!',
                    AxiosError.ERR_BAD_OPTION, null, null, null));
            }
        }
        let res = fs.accessSync(path);
        if (res) {
            return reject(new AxiosError('The file already exist, please delete the file first!',
                AxiosError.ERR_BAD_OPTION, null, null, null));
        }

        let downloadToFile = {
            kind: 'file',
            file: path
        }

        session.downloadToFile(request.url, downloadToFile).then((response) => {
            let realResponse = {
                data: response.statusCode === 200 || response.statusCode === 304 ? 'download success!' : '',
                status: response.statusCode,
                statusText: "",
                headers: config.header,
                config: config,
                request: request
            };

            settle(function _resolve(value) {
                resolve(value);
            }, function _reject(err) {
                reject(err);
            }, realResponse);
            HllRcpSessionManager.releaseTmpSession(session)
        }).catch((err) => {
            HllRcpSessionManager.releaseTmpSession(session)
            reject(new AxiosError(err, AxiosError.ERR_BAD_RESPONSE, config, request, request));
        });
    } catch (err) {
        HllRcpSessionManager.releaseTmpSession(session)
        reject(new AxiosError(JSON.stringify(err), AxiosError.ERR_BAD_OPTION_VALUE, config, request, request));
    }
}

export default download
