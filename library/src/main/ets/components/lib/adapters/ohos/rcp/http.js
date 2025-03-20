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
import HllRcpSessionManager from '../rcp/HllRcpSessionManager';

export default (httpConfig, resolve, reject) => {
    try {
        const { session, request, config } = httpConfig;
        session.fetch(request).then((response) => {
            let responseReal = {
                data: response && response.toString(),
                status: response && response.statusCode,
                statusText: "",
                headers: response && response.headers,
                config: config,
                request: response && response.request,
                performanceTiming: {
                    dnsTiming: response?.timeInfo?.nameLookupTimeMs,
                    tcpTiming: response?.timeInfo?.connectTimeMs,
                    tlsTiming: response?.timeInfo?.tlsHandshakeTimeMs,
                    firstSendTiming: response?.timeInfo?.preTransferTimeMs,
                    firstReceiveTiming: response?.timeInfo?.startTransferTimeMs,
                    totalFinishTiming: undefined,
                    redirectTiming: response?.timeInfo?.redirectTimeMs,
                    responseHeaderTiming: undefined,
                    responseBodyTiming: undefined,
                    totalTiming: response?.timeInfo?.totalTimeMs
                }
            };
            settle(function _resolve(value) {
                resolve(value);
            }, function _reject(err) {
                reject(err);
            }, responseReal);
            HllRcpSessionManager.releaseTmpSession(session)
        }).catch((err) => {
            if (err.message === 'Failed writing received data to disk/application') {
                return reject(new AxiosError(
                    'maxContentLength size of ' + config.maxContentLength + ' exceeded',
                    AxiosError.ERR_BAD_RESPONSE,
                    config,
                    request
                ));
            }
            HllRcpSessionManager.releaseTmpSession(session)
            reject(new AxiosError(JSON.stringify(err), err?.code, config, request, request));
        })
    } catch (e) {
        HllRcpSessionManager.releaseTmpSession(session)
        reject(new AxiosError(JSON.stringify(e), e?.code, config, request, request));
    }
}