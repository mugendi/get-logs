# Get-Logs

List log files contained in a directory, use advanced date and name filters to select specific log files and read the files in a manner that does not burn your RAM 😜

> &nbsp;
> ## Readme by Example
> To fully grasp how this module works. Let as imagine that we have a directory ```dir``` which has the following log files:
> ```txt
> - /logs/error-2021-12-17.log
> - /logs/error-2022-08-24.log
> - /logs/info-2021-12-04.log
> - /logs/info-2022-08-24.log
>```
> &nbsp;


## Initializing

```javascript
// require module
const GetLogs = require('get-logs');

// prep ypur options
const initOpts = {
	logsDir,
	dateFormat: 'YYYY-MM-DD',
};

// pass options
const getLogs = GetLogs(initOpts);
```

### `GetLogs()` Init Options
---

- **`logsDir:`** The directory within which your logs are saved. This option must be entered and be a valid directory path.
- **`dateFormat:`** The date format used while saving your logs. Defaults to 'YYYY-MM-DD';

___

## List Logs
Sometimes you want to see which log files have been generated over a certain duration.

```javascript
(async () => {
	try {
		// options to use
		let listOpts = {
			duration: '1year',
			nameFormat: 'info-{date}.log',
			sort: 'ASC',
		};

		// list logs
		let resp = await getLogs.list(listOpts);

		// response
		console.log(resp);
	} catch (error) {
		console.error(error);
	}
})();
```

This will log the following array.

```javascript
[
	'/home/mugz/.@fetch/logs/info-2021-12-04.log',
	'/home/mugz/.@fetch/logs/info-2022-08-24.log',
];
```

**Note:**
-   Because `nameFormat='info-{date}.log'` we only listed those logs with a similar format.
-   Since `duration='1year`, logs from Dec 2021 to Aug 2022 were listed.
-   Since `sort='ASC'` then we started with the _earliest_ logs.

### `getLogs.list()` Options
---

-   **`duration:`** This determines how far back we intend to read logs. Defaults to "3days".

-   **`nameFormat:`** This string indicates how our logs are formatted. For example, if you have the following logs:

    -   **"info-2022-08-24.log** ~ for ordinary logs
    -   **"error-2022-08-24.log** ~ for error logs

    Then you would use the name formats:

    -   **"info-{date}.log** ~ to match for ordinary logs
    -   **"error-{date}.log** ~ to match for error logs

    Defaults to "\*{date}\*" which will potentially select all log files within the `duration` entered.

-   **`sort:`** Determines the order by which log files are listed. Defaults to "DESC";

___

## Reading Logs

More often, what we want is to read log files, not list them. [Get-Logs](https://www.npmjs.com/package/get-logs) ensures log files are read in chunks of lines to avoid loading files that are too big into memory.

```javascript
(async () => {
	try {
		// options to use
		let readOpts = {
			duration: '1year',
			nameFormat: 'info-{date}.log',
			lines: 1,
			parser: JSON.parse,
			sort: 'DESC',
		};

		// now read logs
		let resp = await getLogs.read(readOpts);

		// response
		console.log(resp);
	} catch (error) {
		console.error(error);
	}
})();
```

This will log an Object similar to the one below.

```javascript
{
  files: {
    current: '/logs/info-2022-08-24.log',
    selected: [
      '/logs/info-2022-08-24.log',
      '/logs/info-2021-12-04.log'
    ]
  },
  fileNum: 1,
  lineNum: 1,
  lines: [
    {
      level: 'info',
      message: 'App listening on port 3000',
      timestamp: '2022-08-24 09:53:53.373 PM'
    }
  ],
  read: [Function: bound read]
}
```

**Note:**

-   We have read only one line because `lines=1`.
-   All log files selected are listed with the one currently being read shown by `files.current`.
- `fileNum` shows we are currently reading the first log file from those selected.
- `lineNum: 1` indicates that this is the first line of `files.current`,
-   We started with the latest log file because `sort="DESC"`.
-   Because we had `JSON.parse` as our parser while calling `read()` all our lines are parsed. Depending on how your logs are formatted, you might need to use another parser.
-   The response includes a `read` key whose value is a function we can call. Calling `read()` will step to the next batch of lines within the `file` till we have finished reading this file. 

    After a file is read to the last line, and `read()` is called, then the next log file matched is loaded and reading continues.

    When all log files listed have been read to the very last line, then `read()` will return null. Be careful to thus test for ```read() !== null```.

    ### Using `read()` to read all logs
    `read()` is very powerful and can be used to read every line of every matched log file within your [`logsDir`](#getlogs-init-options)

    ```javascript
    ...
    // initial read
    // needed as this is what returns the response with a read() method
    let resp = await getLogs.read(readOpts);

    // do whatever with response
    doSomethingWithResp(resp)

    // now loop through till resp is null
    while ((resp = resp.read())) {
        doSomethingWithResp(resp)
    }
    ```


### `getLogs.read()` Options
---

-   All [`list() options`](#getlogslist-options) plus 👇

-   **`lines:`** The number of lines to read from each log at once. Note that log files can be very huge so [fire-read](https://www.npmjs.com/package/fire-read) is used to consume them line-by-line. Defaults to 20.

-   **`parser:`** The function used to parse log files. Defaults to `JSON.parse`. Depending on how your logs are formatted, enter a function to parse the same. If no parsing is desired, then use:
    ```javascript
    {
        parser: function(line){return line}
    }
    ```


___

## Understand Filtering Files

One of the main principles of this module is the ability to filter log files. It is important to understand the two levels that this filtering happens and how it happens.

### Level 1. During Initialization

Basically, when you **initialize** this module and enter a ```dateFormat``` option, you filter out all files that do not have that specific date format in their names. 

It is therefore assumed that all your log files (for many reasons such as log rotation) have a date in their name. Most logging modules such as [winston](https://www.npmjs.com/package/winston) offer that.

If your logs are not named using such a convection, then this module is not for you 😓.

### Level 2. During Log Listing 
When you call ```getLogs.list(options)``` then a second level of filtering happens based on the options you provide.

The ```duration``` option filters out all files whose dates (within their file names of course) falls between now and the past ```duration``` entered. So if ```duration='3d'```, then all logs generated in the past **3 days** will be returned.

So far, all types of log files will be returned. Given our [Log Files](#readme-by-example) above, all **info** and **error** logs matching our ```dateFormat``` and ```duration``` filters will be returned. But what if we only want error logs?

That is where the ```nameFormat``` comes into play. By specifying that ```nameFormat="*error-{date}.log"``` then we ensure we only match error logs.

Every time you call ```getLogs.list(options)``` or ```getLogs.read(options)```, what you are doing, whether you enter all the filtering options or defaults are used is filtering logs. Then reading those filtered.

Ultimately, when all the filtering options are considered, a **glob pattern** is created and [tiny glob](https://www.npmjs.com/package/tiny-lob) is used to get the log files matched. 

Generating glob patterns for `duration` and `dateFormat`is done with the help of [date order](https://www.npmjs.com/package/date-order) and of course [dayjs](https://www.npmjs.com/package/dayjs).

Options are validated using [validate or throw](https://www.npmjs.com/package/validate-or-throw) which relies on [fastest validator](https://www.npmjs.com/package/fastest-validator).

Optimally reading files line by line is provided by [fire-read](https://www.npmjs.com/package/fire-read) which is powered by the amazing [n-readlines](https://www.npmjs.com/package/n-readlines)
