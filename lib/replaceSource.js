"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var schma = null;
var getSchma = function (libratyName, schmaPath) {
    if (schma) {
        return schma;
    }
    var relativePath = "../../" + libratyName + "/" + schmaPath;
    if (fs_1.default.existsSync(relativePath)) {
        var variableMapString = fs_1.default.readFileSync(relativePath, { encoding: 'utf8' });
        var variableMap = null;
        try {
            variableMap = JSON.parse(variableMapString);
        }
        catch (error) {
            throw new Error(libratyName + "\u7684schma\u6587\u4EF6" + schmaPath + "\u4E0D\u80FD\u8F6C\u6210json\u5BF9\u8C61");
        }
        schma = variableMap;
        return variableMap;
    }
};
var replaceSource = function (_a) {
    var t = _a.types;
    return {
        visitor: {
            ImportDeclaration: function (path, source) {
                var _a = source.opts, libratyName = _a.libratyName, schmaPath = _a.schmaPath;
                if (t.isStringLiteral(path.node.source, { value: libratyName })) { // 不匹配目标库
                    return;
                }
                var schma = getSchma(libratyName, schmaPath);
                var replaceSpecifiers = path.node.specifiers.map(function (specifier) {
                    var variable = specifier.local.name;
                    if (t.isImportDefaultSpecifier(specifier)) { // 例如：import React from 'react';
                        return t.importDeclaration([specifier], t.stringLiteral(libratyName + "/lib/index"));
                    }
                    if (t.isImportSpecifier(specifier)) { // 例如：import { component as CMP} from 'react';
                        var variableInFilePath = Object.keys(schma).find(function (filePath) {
                            return schma[filePath].variable.includes(variable);
                        });
                        if (variableInFilePath) {
                            console.log(libratyName + "\u5728" + schmaPath + "\u6CA1\u6709\u627E\u5230\u53D8\u91CF" + variable);
                            return;
                        }
                        return t.importDeclaration([specifier], t.stringLiteral(libratyName + "/lib/" + variableInFilePath));
                    }
                });
            }
        }
    };
};
exports.default = replaceSource;
