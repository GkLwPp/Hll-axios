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

const part = '/data/storage/';

/**
 * 根据已知文件路径，获取文件名。例如输入: internal://cache/temp.jpg, 输出: temp.jpg
 * path: 文件路径
 */
function getFileNameByPath(path) {
    let index = path.lastIndexOf("/");
    let fileName = path.substr(index + 1);
    return fileName;
}

/**
 * 获取 file：  name、contentType、remoteFileName、data、 filePath
 * 1.如果是uri，filePath 直接赋值
 * 2.如果是ArrayBuffer，data 直接赋值，若有option给remoteFileName赋值
 * 3.如果是字符， 存入临时变量data[]，然后给remoteFileName 赋值
 * @param requestData
 * @param reject
 */
function getFileList(requestData, reject, cacheDir) {
    let files = [];
    let data = [];
    requestData.forEach((value, key, option) => {
        // 如果data为空，则必须设置filePath
        if (typeof (value) === 'string' && value.indexOf('internal://') == 0 && cacheDir) { // uri
            // 1、兼容：internal:// + context
            let filename = option && option.filename ? option.filename : getFileNameByPath(value)
            let type = option && option.type ? option.type : getType(filename)
            let restStr = value.split('internal://')[1]
            let defaultDir = cacheDir.split('/cache')[0]
            files.push({
                name: key,
                contentType: type,
                remoteFileName: filename,
                data: '',
                filePath: defaultDir + '/' + restStr
            })
        } else if (typeof (value) === 'string' && value.indexOf(part) == 0) {
            let filename = option && option.filename ? option.filename : getFileNameByPath(value)
            let type = option && option.type ? option.type : getType(filename)
            files.push({
                name: key,
                contentType: type,
                remoteFileName: filename,
                data: '',
                filePath: value
            })
        } else if (value instanceof ArrayBuffer) { // ArrayBuffer
            // 如果data有值，则filePath不会生效
            let defaultName = "default" + Date.now();
            let filename = !option ? defaultName :
                (typeof (option) === 'string') ? option : (option.filename ? option.filename : defaultName);
            let type = option && option.type ? option.type : ''
            let contentType = getType(filename)
            files.push({
                name: key,
                contentType: type ? type : contentType ? contentType : '',
                remoteFileName: filename,
                data: value,
                filePath: ''
            })
        } else {
            // 添加额外参数
            files.push({
                name: key,
                contentType: '',
                remoteFileName: '',
                data: value,
                filePath: ''
            })
        }
    })
    return {
        files: files,
        data: data
    }
}

/**
 * 根据已知文件路径，获取后缀名
 * path: 文件路径
 */
function getType(filename) {
    if (!filename) {
        return ''
    }
    let index = filename.lastIndexOf(".");
    let type = index > -1 ? filename.substr(index) : '';
    return type;
}

/**
 * 上传
 * @param config 配置项
 * @param resolve
 * @param reject
 */
async function upload(httpConfig, resolve, reject) {
    const { session, request, config } = httpConfig;
    try {
        const requestData = config.data;
        // 构建upload请求参数
        let context = config.context;
        let cacheDir = '';
        if (context && context.cacheDir) {
            cacheDir = context.cacheDir;
        }
        let list = getFileList(requestData, reject, cacheDir);
        let uploadFromFile = {
            fileOrPath: list.files
        }
        // 发送upload请求
        session.uploadFromFile(request.url, uploadFromFile)
            .then((response) => {

                let realResponse = {
                    data: response.statusCode === 200 || response.statusCode === 304 ? 'upload success!' : '',
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

                session.close()
            }).catch((err) => {
            session.close()
            reject(new AxiosError(err, AxiosError.ERR_BAD_OPTION_VALUE, config, null, null));
        })
    } catch (err) {
        session.close()
        reject(new AxiosError(err, AxiosError.ERR_BAD_OPTION_VALUE, config, null, null));
    }
}

export default upload