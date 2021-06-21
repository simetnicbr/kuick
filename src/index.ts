import { Fragment, render, h, RenderableProps, VNode } from 'preact';
import { html } from 'htm/preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Dialog, Transition } from '@headlessui/react';
import * as lunr from 'lunr';

/* External constants */

declare const KONG_PLUGINS_IMAGES_DIR: string;
declare const KONG_INGRESSES_DATA: KongIngress[];
declare const IS_TEST_MODE: boolean;
declare const API_V1_INGRESSES_URL: string; // TODO

/* Constants */

const EMPTY_CELL = '---';
const RIGHT_ARROW = '\u2192';

/* Type declarations from API */

interface KubernetesObject {
  apiVersion?: string
  kind?: string
  metadata: {
    name: string
    namespace: string
    annotations?: {[_: string]: any}
  }
  spec?: {[_: string]: any}
}

interface KubernetesIngress extends KubernetesObject {
  spec: {
    rules?: {
      host?: string
      http?: {
        paths?: {
          path?: string
          backend?: {
            serviceName?: string
            servicePort?: number
          }
        }[]
      }
    }[]
  }
}

interface KubernetesKongPlugin extends KubernetesObject {
  plugin: string
  config?: object
  enabled?: boolean
  spec: undefined
}

interface KongIngress {
  index: number
  key: string
  ingress: KubernetesIngress
  plugins: KubernetesKongPlugin[]
}

/* Index building */

function buildLunrIndex(kongIngresses: KongIngress[]) {
  var builder = new lunr.Builder;
  builder.pipeline.add(
    lunr.trimmer,
    // lunr.stopWordFilter,
    lunr.stemmer,
  );
  builder.searchPipeline.add(
    lunr.stemmer,
  );

  builder.ref('key');
  builder.field('name', {extractor: (kongIngress: KongIngress) => kongIngress.ingress.metadata.name});
  builder.field('namespace', {extractor: (kongIngress: KongIngress) => kongIngress.ingress.metadata.namespace});
  builder.field('methods', {extractor: (kongIngress: KongIngress) =>
    (kongIngress.ingress.metadata.annotations['konghq.com/methods'] ?? '').split(',').join(' ')
  });
  builder.field('hosts', {extractor: (kongIngress: KongIngress) => kongIngress.ingress.spec.rules.map(rule => {
    const host = rule.host;
    const paths = (rule.http?.paths ?? []).map(path => path?.path || '').filter(Boolean).join(' ');
    const services = (rule.http?.paths ?? []).map(path => path?.backend?.serviceName || '').filter(Boolean).join(' ');
    const ports = (rule.http?.paths ?? []).map(path => path?.backend?.servicePort || '').filter(Boolean).join(' ');
    const namespacedServices = (rule.http?.paths ?? []).map(path =>
      path?.backend?.serviceName ? `${path.backend.serviceName}.${kongIngress.ingress.metadata.namespace}` : ''
    ).filter(Boolean).join(' ');
    return `${host} ${paths} ${services} ${ports} ${namespacedServices}`;
  }).join(' ')});
  builder.field('plugins', {extractor: (kongIngress: KongIngress) => kongIngress.plugins.map(plugin => {
    const name = plugin.metadata.name;
    const type = plugin.plugin;
    const config = plugin.config ? JSON.stringify(plugin.config) : ''; // TODO
    return `${name} ${type} ${config}`;
  }).join(' ')});

  kongIngresses.forEach(kongIngress => {
    builder.add(kongIngress);
  });

  const index = builder.build();
  // console.log('lunr index', index);
  return index;
}

/* Components */

interface IngressRowProps {
  i: number
  kongIngress: KongIngress
  setSelectedPlugin: (_: KubernetesKongPlugin) => void
  setSelectedKongIngress: (_: KongIngress) => void
  setShowPluginPopup: (_: boolean) => void
}

function IngressRow(props: RenderableProps<IngressRowProps>) {
  const { i, kongIngress, setSelectedPlugin, setSelectedKongIngress, setShowPluginPopup } = props;

  const hostsArray = kongIngress.ingress.spec.rules.reduce((acc, rule) => {
    (rule.http?.paths ?? []).forEach(path => {
      const hostMatch = `${rule.host}${path.path || '/'}`;
      const route = `${path.backend.serviceName}.${kongIngress.ingress.metadata.namespace}:${path.backend.servicePort}`;
      acc.push(html`
        <li key=${hostMatch}>
          ${hostMatch} ${RIGHT_ARROW} ${route}
        </li>`);
    });
    return acc;
  }, [] as VNode[]);

  return html`
    <tr
      class="h-16 sm:h-20 min-h-full hover:bg-blue-200 text-xs sm:text-sm text-center ${
        i % 2 == 0 ? 'bg-green-50' : 'bg-green-100'
      }"
    >
      <td
        class="p-1 sm:px-2"
      >
        ${kongIngress.ingress.metadata.namespace}
      </td>
      <td
        class="p-1 sm:px-2"
      >
        ${kongIngress.ingress.metadata.name}
      </td>
      <td
        class="p-1 sm:px-2"
      >
        ${
          kongIngress.ingress.metadata.annotations['konghq.com/methods']
            ? html`
              <ul>
                ${kongIngress.ingress.metadata.annotations['konghq.com/methods'].split(',').map((method: string) =>
                  html`<li key=${method}>${method}</li>`
                )}
              </ul>`
            : EMPTY_CELL
        }
      </td>
      <td
        class="p-1 sm:px-2"
      >
        ${kongIngress.ingress.metadata.annotations['konghq.com/preserve-host'] || EMPTY_CELL}
      </td>
      <td
        class="p-1 sm:px-2"
      >
        ${kongIngress.ingress.metadata.annotations['konghq.com/strip-path'] || EMPTY_CELL}
      </td>
      <td
        class="p-1 sm:px-2"
      >
        ${hostsArray.length > 0
          ? html`
            <ul>
              ${hostsArray}
            </ul>`
          : EMPTY_CELL
        }
      </td>
      <td
        class="p-1 sm:px-2"
      >
        ${(kongIngress.plugins ?? []).length > 0
          ? html`
            <ul class="flex">
              ${kongIngress.plugins.map(plugin =>
                html`
                  <li
                    key=${plugin.metadata.name}
                    class="flex-shrink-0 m-3"
                  >
                    <button
                      onClick=${() => {
                        setSelectedPlugin(plugin);
                        setSelectedKongIngress(kongIngress);
                        setShowPluginPopup(true);
                      }}
                      class="relative focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <img
                        class="w-12 h-12 ${plugin.enabled ? 'opacity-100 grayscale-0' : 'opacity-75 grayscale'}"
                        src="${KONG_PLUGINS_IMAGES_DIR}${plugin.plugin}.png"
                        alt="Kong plugin ${plugin.plugin} (${plugin.enabled ? 'enabled' : 'disabled'})"
                      />
                      <div
                        class="absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                          plugin.enabled ? 'bg-green-500' : 'bg-red-500'
                        }"
                      ></div>
                    </button>
                  </li>
                `
              )}
            </ul>`
          : EMPTY_CELL
        }
      </td>
    </tr>
  `;
}

interface PluginPopupProps {
  selectedPlugin?: KubernetesKongPlugin
  selectedKongIngress?: KongIngress
  showPluginPopup: boolean
  setShowPluginPopup: (_: boolean) => void
}

function PluginPopup(props: RenderableProps<PluginPopupProps>) {
  const { selectedPlugin, selectedKongIngress, showPluginPopup, setShowPluginPopup } = props;

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  return html`
    <${Transition}
      show=${showPluginPopup}
      as=${Fragment}
    >
      <${Dialog}
        initialFocus=${closeButtonRef}
        onClose=${() => {
          setShowPluginPopup(false);
        }}
        class="fixed z-10 inset-0 overflow-y-auto"
      >
        <div class="flex items-end sm:items-center justify-center min-h-screen">
          <${Transition.Child}
            enter="transition ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <${Dialog.Overlay}
              class="fixed inset-0 bg-blue-900 opacity-60"
            />
          <//>
          <${Transition.Child}
            enter="transition origin-bottom sm:origin-center ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition origin-bottom sm:origin-center ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            class="z-10 bg-gray-50 rounded w-full max-w-md mx-auto px-3 py-6 sm:py-4 text-gray-700"
          >
            <${Dialog.Title}
              class="mt-1 font-medium text-lg leading-tight text-center"
            >
              Plugin - ${
                selectedPlugin
                  ? `${selectedPlugin.metadata.name}.${selectedPlugin.metadata.namespace}`
                  : 'Unknown'
              }
            <//>
            <div
              class="text-sm"
            >
              ${
                selectedPlugin && selectedKongIngress && (
                  html`
                    <div class="mt-4 mb-3 flex">
                      <div
                        class="relative mx-auto"
                      >
                        <img
                          class="w-16 h-16 ${
                            selectedPlugin.enabled ? 'opacity-100 grayscale-0' : 'opacity-75 grayscale'
                          }"
                          src="${KONG_PLUGINS_IMAGES_DIR}${selectedPlugin.plugin}.png"
                          alt="Kong plugin ${selectedPlugin.plugin} (${
                            selectedPlugin.enabled ? 'enabled' : 'disabled'
                          })"
                        />
                        <div
                          class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full ${
                            selectedPlugin.enabled ? 'bg-green-500' : 'bg-red-500'
                          }"
                        ></div>
                      </div>
                    </div>
                    <div
                      class="my-2"
                    >
                      <div
                        class="text-gray-800 font-medium"
                      >
                        Kong Ingress
                      </div>
                      <div
                        class="mx-1 font-light"
                      >
                        ${selectedKongIngress.ingress.metadata.namespace}.${selectedKongIngress.ingress.metadata.name}
                      </div>
                    </div>
                    <div
                      class="my-2"
                    >
                      <div
                        class="text-gray-800 font-medium"
                      >
                        Plugin type
                      </div>
                      <div
                        class="mx-1 font-light"
                      >
                        ${selectedPlugin.plugin ?? 'Unknown'}
                      </div>
                    </div>
                    <div
                      class="my-2"
                    >
                      <div
                        class="text-gray-800 font-medium"
                      >
                        Status
                      </div>
                      <div
                        class="mx-1 font-light ${selectedPlugin.enabled ? '' : 'text-red-400'}"
                      >
                        ${selectedPlugin.enabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div
                      class="my-2"
                    >
                      <div
                        class="text-gray-800 font-medium"
                      >
                        Plugin config
                      </div>
                      <div
                        class="sm:px-1"
                      >
                        <textarea
                          rows="4"
                          readonly
                          class="text-xs w-full py-1 bg-white break-words border border-gray-800 text-gray-700 font-light font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <!-- TODO: Check if this can lead to XSS exploits -->
                          ${JSON.stringify(selectedPlugin.config)}
                        </textarea>
                      </div>
                    </div>
                  `
                )
              }
            </div>
            <div
              class="mt-4 mb-1"
            >
              <button
                ref=${closeButtonRef}
                onClick=${() => {
                  setShowPluginPopup(false);
                }}
                class="block py-2 px-4 rounded-lg mx-auto bg-gray-300 font-semibold transition-colors hover:bg-gray-400 focus:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Close pop-up
              </button>
            </div>
          <//>
        </div>
      <//>
    <//>
  `;
}

/* Top-level component */

interface AppProps {
  kongIngresses?: KongIngress[]
  isTestMode?: boolean
}

function App(props : RenderableProps<AppProps>) {
  const { kongIngresses, isTestMode } = props;

  const ingressesIndex = useRef<lunr.Index>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchActive, setSearchActive] = useState<boolean>(false);
  const [isSearchErrored, setSearchErrored] = useState<boolean>(false);
  const [fetchedKongIngresses, _] = useState<KongIngress[]>(kongIngresses);
  const [filteredKongIngresses, setFilteredKongIngresses] = useState<KongIngress[]>(kongIngresses);
  const [selectedKongIngress, setSelectedKongIngress] = useState<KongIngress|undefined>(undefined);
  const [selectedPlugin, setSelectedPlugin] = useState<KubernetesKongPlugin|undefined>(undefined);
  const [showPluginPopup, setShowPluginPopup] = useState<boolean>(false);

  useEffect(() => {
    ingressesIndex.current = buildLunrIndex(fetchedKongIngresses);
    if (isSearchActive && !isSearchErrored) {
      const searchValue = searchInputRef.current.value.trim();
      try {
        const results = ingressesIndex.current.search(searchValue);
        setSearchErrored(false);
        setSearchActive(Boolean(searchValue));
        setFilteredKongIngresses(searchValue
          ? results.map(result => fetchedKongIngresses.find(ingress => ingress.key == result.ref)).filter(Boolean)
          : kongIngresses);
      } catch (e) {
        console.error('Search error', e);
        setSearchErrored(true);
      }
    }
  }, [fetchedKongIngresses])

  return html`
    <div
      class="max-h-screen relative flex flex-col"
    >
      <h1 class="mx-8 pt-3 mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-gray-800 text-center leading-snug">
        ${isTestMode ? "(TEST MODE) kuick" : "kuick - The Kong UI for Ingress Controller in Kubernetes"}
      </h1>
      <div
        class="mt-2 mb-5 sm:mb-8 mx-0 sm:mx-2"
      >
        <div
          class="flex mx-auto w-full max-w-lg rounded-lg bg-gray-200 ${isSearchErrored ? 'ring ring-red-400' : 'focus-within:ring-2 focus-within:ring-blue-400'}"
        >
          <input
            type="search"
            placeholder="Search..."
            class="self-stretch px-3 py-1 sm:px-4 sm:py-2 w-0 flex-1 rounded-lg bg-gray-200 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-lg sm:text-xl text-gray-800 placeholder-gray-500"
            ref=${searchInputRef}
            onInput=${() => {
              const searchValue = searchInputRef.current.value.trim();
              try {
                const results = ingressesIndex.current.search(searchValue);
                setSearchErrored(false);
                setSearchActive(Boolean(searchValue));
                setFilteredKongIngresses(searchValue
                  ? results.map(result => fetchedKongIngresses.find(ingress => ingress.key == result.ref)).filter(Boolean)
                  : kongIngresses);
              } catch (e) {
                console.error('Search error', e);
                setSearchErrored(true);
              }
            }}
          />
          <div
            class="self-stretch flex items-center"
          >
            ${isSearchActive && html`
              <button
                onClick=${() => {
                  if (searchInputRef.current) {
                    searchInputRef.current.value = '';
                    searchInputRef.current.focus();
                  }
                  setSearchErrored(false);
                  setSearchActive(false);
                  setFilteredKongIngresses(kongIngresses);
                }}
                class="m-1 p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-400/60 transition-colors focus:outline-none focus:text-gray-800 focus:bg-gray-400/60"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </button>
            `}
            <a
              href="https://lunrjs.com/guides/searching.html"
              target="_blank"
              class="m-1 p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-400/60 transition-colors focus:outline-none focus:text-gray-800 focus:bg-gray-400/60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
        <div
          class="pt-1 text-center text-sm text-gray-600"
        >
          ${
            isSearchActive ? (
              `Displaying ${filteredKongIngresses.length} / ${props.kongIngresses.length} results`
            ) : (
              `Found ${props.kongIngresses.length} Kong ingressses`
            )
          }
        </div>
      </div>
      <div
        class="pb-16 w-full flex-shrink overflow-auto"
      >
        <table
          class="mx-auto text-gray-800 table-auto w-max overscroll-contain"
        >
          <thead>
            <tr
              class="sticky top-0 z-10 bg-green-300 bg-parkay-green-400/40 text-lg sm:text-xl"
            >
              <th
                class="font-normal p-1 sm:py-2 sm:px-3"
              >
                Namespace
              </th>
              <th
                class="font-normal p-1 sm:py-2 sm:px-3"
              >
                Name
              </th>
              <th
                class="font-normal p-1 sm:py-2 sm:px-3"
              >
                HTTP methods
              </th>
              <th
                class="font-normal p-1 sm:py-2 sm:px-3"
              >
                Preserve host
              </th>
              <th
                class="font-normal p-1 sm:py-2 sm:px-3"
              >
                Strip path
              </th>
              <th
                class="font-normal p-1 sm:py-2 sm:px-3"
              >
                Hosts
              </th>
              <th
                class="font-normal p-1 sm:py-2 sm:px-3"
              >
                Plugins
              </th>
            </tr>
          </thead>
          <tbody>
            ${filteredKongIngresses.map((kongIngress, i) => html`
              <${IngressRow}
                i=${i}
                key="${kongIngress.ingress.metadata.name}.${kongIngress.ingress.metadata.namespace}"
                kongIngress=${kongIngress}
                setSelectedPlugin=${setSelectedPlugin}
                setSelectedKongIngress=${setSelectedKongIngress}
                setShowPluginPopup=${setShowPluginPopup}
              />`
            )}
          </tbody>
        </table>
      </div>
    </div>
    <${PluginPopup}
      selectedPlugin=${selectedPlugin}
      selectedKongIngress=${selectedKongIngress}
      showPluginPopup=${showPluginPopup}
      setShowPluginPopup=${setShowPluginPopup}
    />
  `;
}

/* Preact entrypoint */

render(
  // Use h directly to prevent Typescript from removing it as "unused import"
  h(App, {
    kongIngresses: KONG_INGRESSES_DATA,
    isTestMode: IS_TEST_MODE,
  }),
  // html`<${App} kongIngresses=${KONG_INGRESSES_DATA} isTestMode=${IS_TEST_MODE} />`,
  document.querySelector("#app")
);
