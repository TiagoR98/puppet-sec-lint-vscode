'use strict';

import * as net from 'net';

import {Trace} from 'vscode-jsonrpc';
import { window, workspace, commands, ExtensionContext, Uri, TextDocumentChangeEvent, TextDocument, languages, Diagnostic, DiagnosticSeverity, Range, Position } from 'vscode';
import { LanguageClient, LanguageClientOptions, StreamInfo, Position as LSPosition, Location as LSLocation } from 'vscode-languageclient/node';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	const axios = require('axios');

	let diagnosticCollection = languages.createDiagnosticCollection("stuff");
	let diagnostics : Diagnostic[] = [];

	// run puppet-sec-lint
	const cp = require('child_process')
	cp.exec('puppet-sec-lint', (err:any, stdout:any, stderr:any) => {
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
		if (err) {
			console.log('error: ' + err);
		}
	});

	let currOpenEditor = window.activeTextEditor;
	if (currOpenEditor){
	let currActiveDoc = currOpenEditor.document;

	let onDidChangeDisposable = workspace.onDidSaveTextDocument((document: TextDocument)=>{
		
		if (document === currActiveDoc){
				axios.post('http://localhost:9292', {
					documentContent: document.getText()
				})
				.then((response:any) => {
					console.log(response.data);

					diagnostics = [];

					response.data.forEach(function(sin:any) {
						sin=JSON.parse(sin);

						let range = new Range(sin.begin_line-1,sin.begin_char-1,sin.end_line-1,sin.end_char);
					
						let newDiagnostic = new Diagnostic(range, sin.message+" - [Recommendation] - "+sin.recommendation, DiagnosticSeverity.Warning);
						newDiagnostic.source = "Puppet-sec-lint";

						diagnostics.push(newDiagnostic);
					});
		
					diagnosticCollection.set(document.uri, diagnostics);
				});

		}
		else {
			console.log('Non watched doc changed');
		}
	});
	
	let onDidCloseDisposable = workspace.onDidCloseTextDocument((closedDoc: TextDocument)=>{
		if (closedDoc === currActiveDoc){
			console.log('Watched doc was closed');
		}
		else {
			console.log('non watched doc closed');
		}
	});

	context.subscriptions.push(onDidChangeDisposable);
	context.subscriptions.push(onDidCloseDisposable);
	}



}

// this method is called when your extension is deactivated
export function deactivate() {}
