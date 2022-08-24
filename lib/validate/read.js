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

// it extends the list schema
const schema = Object.assign(require('./list').schema, {
	lines: {
		type: 'number',
		optional: true,
		default: 20,
		positive: true,
		integer: true,
	},
	parser: {
		type: 'function',
		optional: true
	},
});

module.exports.validate = (obj) => {
	validateOrThrow(obj, schema);
};

module.exports.schema = schema;
