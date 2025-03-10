import buildURL from '../../../../lib/helpers/buildURL.js';
import AxiosError from '../../../../lib/core/AxiosError';
import buildFullPath from '../../../../lib/core/buildFullPath';
import rcp from '@hms.collaboration.rcp';
import utils from '../../../utils';
import buffer from '@ohos.buffer';

const convertAxiosConfigToRcp = (config, reject, eventHandler) => {
    // 1.url校验
    let fullPath = buildFullPath(config.baseURL, config.url);
    if (!fullPath) {
        return reject(new AxiosError("Cannot read properties of url!", AxiosError.ERR_BAD_OPTION, config, null, null));
    } else if (typeof (fullPath) !== 'string') {
        return reject(new AxiosError("Url type should be character type！", AxiosError.ERR_BAD_OPTION_VALUE, config,
            null, null));
    }
    // 2.判断设置的请求体的大小
    judgeMaxBodyLength(config, reject);

    // 3.构建rcp session
    const sessionConfig = {
        requestConfiguration: {
            transfer: {
                autoRedirect: true,
                timeout: {
                    connectMs: utils.isNumber(config.connectTimeout) ? config.connectTimeout : 60 * 1000,
                    transferMs: utils.isNumber(config.timeout) ? config.timeout : 60 * 1000,
                },
            },
            tracing: {
                verbose: true,
                collectTimeInfo: true,
                httpEventsHandler: eventHandler,
            },
            proxy: convertAxiosProxyToRcp(config),
            // dns: {
            //     dnsRules: [
            //         { host: "https://example.com", port: 443, ipAddresses: ["192.168.1.1", "192.168.1.2"] }
            //     ]
            // },
        },
        baseAddress: config.baseURL,
        headers: config.headers,
        // cookies: {
        //     "user": "john_doe",
        //     "session_id": "abc123",
        // },
        // sessionListener: {
        //     onCanceled: () => console.warn("greek", "Session was cancelled"),
        //     onClosed: () => console.warn("greek", "Session was closed"),
        // },
    };

    let session = rcp.createSession(sessionConfig)

    if (config.cancelToken) {
        config.cancelToken.promise.then(cancel => {
            if (session) {
                session.cancel();
                reject(new AxiosError('Request canceled', AxiosError.ECONNABORTED, config, null));
            }
        });
    }

    let url = buildURL(fullPath, config.params, config.paramsSerializer)

    // 5.构建rcp fetch request
    let request = new rcp.Request(
        url,
        config.method.toUpperCase(),
        config.headers,
        config.data,
    )

    return {
        session,
        request,
        config
    }
}

const convertAxiosProxyToRcp = (config) => {
    if (utils.isUndefined(config.proxy)) {
        return 'no-proxy'
    }

    if (config.proxy.host === 'system' || config.proxy.host === 'SYSTEM') {
        return 'system'
    }

    const rcpProxy = {
        url: config.proxy.host + ':' + config.proxy.port,
        createTunnel: 'auto',
        exclusions: config.proxy.exclusionList,
        security: {
            certificate: {
                filePath: config.clientCert?.certPath,
                type: config.clientCert?.certType ? config.clientCert?.certType.toUpperCase() :
                    config.clientCert?.certType,
                key: config.clientCert?.keyPath,
                keyPassword: config.clientCert?.keyPasswd,
            },
            // serverAuthentication: {
            //     credential: {
            //         username: "proxy-username",
            //         password: "proxy-password",
            //     },
            //     authenticationType: "basic",
            // },
        },
    };

    return rcpProxy
}

/**
 * @param data 需要计算字节的数据
 */
const calculateLength = (data) => {
    let len = 0;
    if (data) {
        if (typeof data === 'string') {
            len = buffer.byteLength(data, 'utf8');
        } else if (buffer.isBuffer(data)) {
            len = data.length;
        } else if (data instanceof ArrayBuffer) {
            len = data.byteLength;
        } else if (typeof data === 'number') {
            len = data;
        } else {
            let tmp = data;
            if (utils.isFormData(data)) {

                function formDataToObject(formData) {
                    let object = {};
                    formData.forEach(function (value, key) {
                        object[key] = value;
                    });
                    return object;
                }

                tmp = formDataToObject(data);
            }
            len = buffer.byteLength(JSON.stringify(tmp), 'utf8');
        }
    }
    return len;
}
/**
 * @param config 请求配置项
 * @param reject 失败回调
 */
const judgeMaxBodyLength = (config, reject) => {
    // 计算请求体大小
    let requestBodyLength = calculateLength(config.data);
    if (config.maxBodyLength > -1 && requestBodyLength > config.maxBodyLength) {
        return reject(new AxiosError('Request body larger than maxBodyLength limit', AxiosError.ERR_BAD_REQUEST,
            config));
    }
}

export { convertAxiosConfigToRcp }