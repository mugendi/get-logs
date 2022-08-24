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

const dayjs = require('dayjs'),
	glob = require('tiny-glob'),
	fs = require('fs'),
	dateOrder = require('date-order');

const validateOrThrow = require('validate-or-throw');

// toObject plugin
dayjs.extend(require('dayjs/plugin/toObject'));
const numSort = (a, b) => a - b;

class GetLogs {
	constructor(opts) {
		let schema = {
			logsDir: {
				type: 'string',
			},
		};

		// validate
		validateOrThrow(opts, schema);

		//
		if (
			!fs.existsSync(opts.logsDir) ||
			!fs.statSync(opts.logsDir).isDirectory()
		) {
			throw new Error(`${opts.logsDir} is not a valid directory`);
		}

		// console.log(opts);
		this.options = opts;
	}

	#format_set(v, len = 2) {
		return Array.from(v)
			.map((v) => v.toString().padStart(len, '0'))
			.sort(numSort);
	}

	#make_glob_pattern(opts) {
		const { format, duration } = opts;
		const periods = {
			H: 'hour',
			D: 'day',
			W: 'week',
			M: 'month',
			Y: 'year',
		};

		// console.log({ format, duration });

		//
		let m = duration.match(/([0-9]+)\s*([A-Z])/);
		//console.log(m);
		if (!m) throw new Error('Wrong period formatting');
		let period = periods[m[2]] || 'day';
		let count = m[1];
		let since = dayjs().subtract(count, period);

		let daysCount = 0;
		let now = dayjs();
		let d, o;

		let patterns = {
			hour: new Set(),
			day: new Set(),
			month: new Set(),
			year: new Set(),
		};

        // console.log({m, count, period, since});

		while ((d = now.subtract(daysCount++, 'days')) && d.isAfter(since)) {
			o = d.toObject();

			patterns.hour.add(o.hours);
			patterns.day.add(o.date);
			patterns.month.add(o.months + 1);
			patterns.year.add(o.years);
		}

		for (let k in patterns) {
			patterns[k] = '{' + this.#format_set(patterns[k]).join(',') + '}';
		}

		// console.log(patterns);

		// now make the glob string...
		// 1st we get order of pattern
		let date_order = dateOrder(format);
		let orderedPat = [];

		for (let dateComp of date_order) {
			if (dateComp in patterns) {
				orderedPat.push(patterns[dateComp]);
			}
		}

		this.globPattern = '*' + orderedPat.join('-') + '*';
	}

	async load(opts) {
		let schema = {
			duration: {
				type: 'string',
				uppercase: true,
				pattern: /[0-9]+([dwmyh]|day|week|month|year|hour)/i,
			},
			format: {
				type: 'string',
				uppercase: true,
				pattern: /[YD]{2,4}-M{2,4}-[YD]{2,4}/,
			},
		};

		// validate
		validateOrThrow(opts, schema);

		// console.log(opts);
		this.#make_glob_pattern(opts);

		let globOpts = {
			absolute: true,
			filesOnly: true,
			cwd: this.options.logsDir,
		};

		// glob
        // console.log(this.globPattern);
		let files = await glob(this.globPattern, globOpts);

		return files
	}
}

module.exports = (opts = {}) => new GetLogs(opts);
