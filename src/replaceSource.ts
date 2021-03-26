import babelCore,{PluginObj} from '@babel/core';
import {NodePath} from '@babel/traverse';
import fs from 'fs';
type Param = typeof babelCore;
interface INodePath extends NodePath {
    opts: {
        libratyName: string; // 目标库的名称
        schmaPath: string; // schma.json文件在库中的路径
    }
}

interface VariableCST {
    variable: string[]
}
type Schma = Record<string,VariableCST> 
let schma:Schma = null;

const getSchma = (libratyName:string, schmaPath:string):Schma => {
    if(schma){
        return schma;    
    }
    const relativePath = `../../${libratyName}/${schmaPath}`
    if(fs.existsSync(relativePath)){
        const variableMapString = fs.readFileSync(relativePath, {encoding:'utf8'});
        let variableMap:Schma = null;
        try {
            variableMap = JSON.parse(variableMapString);
        } catch (error) {
            throw new Error(`${libratyName}的schma文件${schmaPath}不能转成json对象`);    
        }
        schma = variableMap;
        return variableMap;
    }
}
const replaceSource = function({types: t}:Param): PluginObj<INodePath>{
    return {
        visitor: {
            ImportDeclaration(path, source){
                const {opts: { libratyName, schmaPath}} = source;
                if(t.isStringLiteral(path.node.source, {value: libratyName})){// 不匹配目标库
                    return;
                }
                const schma = getSchma(libratyName, schmaPath);
                const replaceSpecifiers = path.node.specifiers.map((specifier) => {
                    const variable = specifier.local.name;
                    
                    if(t.isImportDefaultSpecifier(specifier)){// 例如：import React from 'react';
                        return t.importDeclaration([specifier], t.stringLiteral(`${libratyName}/lib/index`))
                    }

                    if(t.isImportSpecifier(specifier)){// 例如：import { component as CMP} from 'react';
                        const variableInFilePath = Object.keys(schma).find((filePath:string) => {
                            return schma[filePath].variable.includes(variable)
                        })
                        if(variableInFilePath){
                            console.log(`${libratyName}在${schmaPath}没有找到变量${variable}`);
                            return;
                        }
                        return t.importDeclaration([specifier], t.stringLiteral(`${libratyName}/lib/${variableInFilePath}`));
                    }
                })
            }
        }
    }
}

export default replaceSource;