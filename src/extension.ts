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

export async function activate(context: ExtensionContext) {

	const connectionInfo = {
        port: 5007
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
	cp.exec('puppet-sec-lint', (err:any, stdout:any, stderr:any) => {
		client.outputChannel.appendLine('stdout: ' + stdout);
		client.outputChannel.appendLine('stderr: ' + stderr);
		if (err) {
			client.outputChannel.appendLine('Error running the ruby gem command:\n ' + err);
			client.outputChannel.appendLine('Please make sure that the \'puppet-sec-lint\' gem is installed and working correctly.\n');
		}
	});

	// Start the client. This will also launch the server
	setTimeout(() => {  client.start(); }, 1000);



}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	cp.stop();
	return client.stop();
}
