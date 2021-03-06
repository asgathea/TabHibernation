'use strict'

var whitelist
var whitelistArray = new Array()

chrome.storage.sync.get(function(items) {
	if (items.whitelist) {
		whitelist = items.whitelist
		whitelistArray = whitelist.split('\n')
	}
})

function inWhitelist(url) {
	var listed = false
	whitelistArray.forEach(function(item) {
		if (url.startsWith(item)) {
			listed = true
		}
	})
	return listed
}

function sleepTab(html, tab) {
	var pageInfo = {
		url: tab.url,
		title: tab.title,
		hibernationInfo: chrome.i18n.getMessage('hibernationPageInfo'),
		buttonText: chrome.i18n.getMessage('hibernationPageButton'),
		favIconUrl: tab.favIconUrl
	}
	var pageHtml = html.replace(/\{\/\*pageInfoObject\*\/\}/, JSON.stringify(pageInfo))
	var dataURL = 'data:text/html;charset=utf-8,' + encodeURIComponent(pageHtml)
	chrome.tabs.update(tab.id, {url: dataURL})
}

chrome.browserAction.onClicked.addListener(function(tab) {
	var c = 0

	var xmlHttp = new XMLHttpRequest()
	xmlHttp.open('GET', chrome.runtime.getURL('hibernationPage/index.html'), true)
	xmlHttp.onload = function () {
		var html = xmlHttp.responseText

		chrome.windows.getAll({populate: true}, function(windows) {
			windows.forEach(function(win) {
				win.tabs.forEach(function(tab) {
					if (tab.active || tab.highlighted || tab.pinned) return
					if (tab.status !== 'complete') return
					if (!tab.url.match(/^https?:\/\//)) return
					if (inWhitelist(tab.url)) return

					sleepTab(html, tab)
					c++
				})
			})
		})
	}
	xmlHttp.send(null)
})

const onInstalledDetails = {details: {'OnInstalledReason': 'installed'}}

chrome.runtime.onInstalled.addListener(function(onInstalledDetails) {
	chrome.contextMenus.create({
		id : 'SleepTab',
		title : chrome.i18n.getMessage('contextMenuTitle'),
		contexts : ['page']
	})
})

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	var xmlHttp = new XMLHttpRequest()
	xmlHttp.open('GET', chrome.runtime.getURL('hibernationPage/index.html'), true)
	xmlHttp.onload = function () {
		var html = xmlHttp.responseText
		sleepTab(html, tab)
	}
	xmlHttp.send(null)
})

chrome.commands.onCommand.addListener(function(command) {
	chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tab) {
		var xmlHttp = new XMLHttpRequest()
		xmlHttp.open('GET', chrome.runtime.getURL('hibernationPage/index.html'), true)
		xmlHttp.onload = function () {
			var html = xmlHttp.responseText
			sleepTab(html, tab[0])
		}
		xmlHttp.send(null)
	})
})
