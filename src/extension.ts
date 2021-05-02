'use strict';

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	StreamInfo
} from 'vscode-languageclient/node';

import * as net from 'net';

let client: LanguageClient;
export function activate(context: ExtensionContext) {

	// run puppet-sec-lint
	const cp = require('child_process')
	//cp.exec('puppet-sec-lint', (err:any, stdout:any, stderr:any) => {
	//	console.log('stdout: ' + stdout);
	//	console.log('stderr: ' + stderr);
	//	if (err) {
	//		console.log('error: ' + err);
	//	}
	//});

	const connectionInfo = {
        port: 5007
    };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
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
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();



}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
