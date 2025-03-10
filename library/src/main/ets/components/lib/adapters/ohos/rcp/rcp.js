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

import http from './http.js';
import download from './download.js';
import upload from './upload.js';
import FormData from '../../../env/classes/FormData.js';
import { convertAxiosConfigToRcp } from './convert.js';

const isXHRAdapterSupported = true

export default isXHRAdapterSupported && function (config) {
    return new Promise(function (resolve, reject) {
        if (config.data && config.data instanceof FormData && config.method.toUpperCase() === 'POST') {
            // 上传
            const uploadEventsHandler = {
                onUploadProgress: (totalSize, transferredSize) => {
                    if (config.onUploadProgress !== null
                        && config.onUploadProgress !== undefined
                        && typeof config.onUploadProgress === 'function') {
                        config.onUploadProgress({
                            loaded: transferredSize,
                            total: totalSize
                        })
                    }
                },
            };
            const httpUploadConfig = convertAxiosConfigToRcp(config, reject, uploadEventsHandler);
            upload(httpUploadConfig, resolve, reject);
        } else if (config.filePath) {
            // 下载
            const downloadEventsHandler = {
                onDownloadProgress: (totalSize, transferredSize) => {
                    if (config.onDownloadProgress !== null
                        && config.onDownloadProgress !== undefined
                        && typeof config.onDownloadProgress === 'function') {
                        config.onDownloadProgress({
                            loaded: transferredSize,
                            total: totalSize
                        })
                    }
                }
            };
            const httpDownloadConfig = convertAxiosConfigToRcp(config, reject, downloadEventsHandler);
            download(httpDownloadConfig, resolve, reject);
        } else {
            const httpConfig = convertAxiosConfigToRcp(config, reject, undefined);
            http(httpConfig, resolve, reject);
        }
    })
}
