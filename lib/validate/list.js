// Copyright 2022 Anthony Mugendi
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const validateOrThrow = require('validate-or-throw');

const schema = {
    duration: {
        type: 'string',
        uppercase: true,
        pattern: /[0-9]+([dwmyh]|(|day|week|month|year|hour)s?)/i,
        optional: true,
        trim: true,
        default: '3DAYS',
    },
    nameFormat: {
        type: 'string',
        optional: true,
        pattern: /.*\{date\}.*/i,
        default: '*{date}*',
    },
    sort : {
        type : "string",
        uppercase:true,
        enum:['ASC','DESC'],
        optional:true,
        default:"DESC"
    }
};

module.exports.validate = (obj)=>{
    validateOrThrow(obj, schema)
}

module.exports.schema = schema
