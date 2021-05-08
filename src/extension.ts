'use strict';

import { workspace, ExtensionContext, window } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	StreamInfo
} from 'vscode-languageclient/node';

import * as net from 'net';

let client: LanguageClient;
let cp: any;
let outputChannel = window.createOutputChannel("Puppet Security Linter");

export async function activate(context: ExtensionContext) {

	var fp = require("find-free-port");
	fp(3000, function(err:any, freePort:any){

		if(err)
			{throw err;}

		const connectionInfo = {
			port: freePort
		};

		const serverOptions = () => {
			// Connect to language server via socket
			const socket = net.connect(connectionInfo);
			const result: StreamInfo = {
				writer: socket,
				reader: socket
			};
			return Promise.resolve(result);
		};

		// Options to control the language client
		const clientOptions: LanguageClientOptions = {
			// Register the server for plain text documents
			documentSelector: [{ scheme: 'file', language: 'puppet' }],
			synchronize: {
				// Notify the server about file changes to '.clientrc files contained in the workspace
				fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
			}
		};

		// Create the language client and start the client.
		client = new LanguageClient(
			'puppet-sec-lint',
			'Puppet Security Linter',
			serverOptions,
			clientOptions
		);

		// run puppet-sec-lint
		cp = require('child_process');
		var child = cp.exec('puppet-sec-lint -p '+freePort, (err:any, stdout:any, stderr:any) => {
			client.outputChannel.appendLine('stdout: ' + stdout);
			client.outputChannel.appendLine('stderr: ' + stderr);
			if (err) {
				client.outputChannel.appendLine('Error running the ruby gem command:\n ' + err);
				client.outputChannel.appendLine('Please make sure that the \'puppet-sec-lint\' gem is installed and working correctly.\n');
			}
		});

		child.stdout.on('data', function (data:any) {
			if(data.toString().includes('-------------')) //TODO: Set a log option so that communications are not visible in vscode and this condition can be removed
				{outputChannel.appendLine(data.toString().split('-------------')[0]);}
		});

		outputChannel.show(true);

		// Start the client. This will also launch the server
		setTimeout(() => {  client.start(); }, 1000);

	});


}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	cp.stop();
	outputChannel.clear();
	outputChannel.hide();
	return client.stop();
}
