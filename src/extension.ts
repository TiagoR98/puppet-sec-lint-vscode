'use strict';

import { workspace, ExtensionContext, window } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	SemanticTokenModifiers,
	StreamInfo
} from 'vscode-languageclient/node';

import * as net from 'net';
import { allowedNodeEnvironmentFlags } from 'node:process';
import { start } from 'node:repl';

let client: LanguageClient;
let cp: any;

export async function activate(context: ExtensionContext) {

	var fp = require("find-free-port");
	var started = false

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

		if(process.platform === "win32"){
			cp.exec('puppet-sec-lint -p '+freePort);
		}

		var child = cp.exec('puppet-sec-lint -p '+freePort);

		child.stdout.on('data', function (data:any) {
			client.outputChannel.appendLine(data);
		});

		child.stderr.on('data', function (data:any) {
			client.outputChannel.appendLine(data);
			client.outputChannel.appendLine('Error running the ruby gem command:\n ' + err);
			client.outputChannel.appendLine('Please make sure that the \'puppet-sec-lint\' gem is installed and working correctly.\n');
		});

		client.outputChannel.show(true);

		setTimeout(() => {  client.start(); }, 3000);
	});


}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	cp.stop();
	return client.stop();
}
