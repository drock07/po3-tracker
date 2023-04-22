import { Fragment, useState } from 'react'
import clsx from 'clsx'
import {
  Dialog,
  Disclosure,
  Menu,
  Popover,
  Transition,
} from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { NumericFormat } from 'react-number-format'

import crops, { type SeedTier } from '../data/crops'
import { useSearchParams } from 'react-router-dom'
import { useSession } from '../contexts/SessionsContext'

function groupBy<T, K extends keyof any>(
  items: T[],
  getKey: (item: T) => K,
  getGroupName?: (value: string) => string
) {
  return Object.entries(
    items.reduce((prev, current) => {
      const group = getKey(current)
      if (!prev[group]) prev[group] = []
      prev[group].push(current)
      return prev
    }, {} as Record<K, T[]>)
  ).map<{ groupValue: string; groupName?: string; items: T[] }>(
    ([key, value]) => ({
      groupName: getGroupName?.(key),
      groupValue: key,
      items: value as T[],
    })
  )
}

type SortValues = 'alpha:asc' | 'alpha:desc'
const sortOptions: { name: string; value: SortValues }[] = [
  { name: 'A-Z', value: 'alpha:asc' },
  { name: 'Z-A', value: 'alpha:desc' },
]

type GroupByValues = 'tier' | 'none'
const groupByOptions: { name: string; value: GroupByValues }[] = [
  { name: 'Tier', value: 'tier' },
  { name: 'None', value: 'none' },
]

const filters = [
  {
    id: 'tier',
    name: 'Tier',
    options: [
      { value: '1', label: 'Tier 1' },
      { value: '2', label: 'Tier 2' },
      { value: '3', label: 'Tier 3' },
      { value: '4', label: 'Tier 4' },
      { value: '5', label: 'Tier 5' },
      { value: '6', label: 'Tier 6' },
    ],
  },
  {
    id: 'completed',
    name: 'Completed',
    options: [{ value: 'hide', label: 'Hide Completed' }],
  },
]

export default function Crops() {
  const [session, { toggleCrop }] = useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const sortOption = sortOptions.find(
    (so) =>
      so.value === ((searchParams.get('sort') as SortValues) ?? 'alpha:asc')
  )
  const groupByOption = groupByOptions.find(
    (gbo) =>
      gbo.value === ((searchParams.get('groupBy') as GroupByValues) ?? 'tier')
  )

  const activeFilters = searchParams
    .getAll('filter')
    .map((filterString) => {
      const [id, value] = filterString.split('.')
      const filter = filters
        .find((f) => f.id === id)
        ?.options.find((f) => f.value === value)
      if (filter) {
        return { id, value, label: filter.label }
      } else {
        return null
      }
    })
    .filter((f): f is Exclude<typeof f, null> => f !== null)

  const tierFilters = activeFilters
    .filter((f) => f.id === 'tier')
    .map((f) => Number(f.value) as SeedTier)

  const filteredCrops = crops
    .filter((seed) => {
      return activeFilters.find((f) => f.id === 'completed')
        ? !session.crops[seed.id]
        : true
    })
    .filter((seed) => {
      return tierFilters.length > 0 ? tierFilters.includes(seed.tier) : true
    })
    .sort((a, b) => {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
      let compResult = nameA > nameB ? 1 : nameA < nameB ? -1 : 0
      if (sortOption?.value === 'alpha:desc') compResult *= -1
      return compResult
    })

  const filteredCropGroups = groupBy(
    filteredCrops,
    (seed) => (groupByOption?.value === 'none' ? '' : seed.tier),
    (value) => (groupByOption?.value === 'none' ? '' : `Tier ${value}`)
  )

  const filteredIncompleteCrops = filteredCrops.filter(
    (seed) => !session.crops[seed.id]
  )

  const essenceCounts = filteredIncompleteCrops.reduce(
    (counts, seed) => {
      switch (seed.tier) {
        case 1:
          counts[1] += 8
          break
        case 2:
          counts[1] += 32
          counts[2] += 8
          break
        case 3:
          counts[1] += 128
          counts[2] += 32
          counts[3] += 8
          break
        case 4:
          counts[1] += 512
          counts[2] += 128
          counts[3] += 32
          counts[4] += 8
          break
        case 5:
          counts[1] += 2048
          counts[2] += 512
          counts[3] += 128
          counts[4] += 32
          counts[5] += 8
          break
        case 6:
          counts[1] += 8192
          counts[2] += 2048
          counts[3] += 512
          counts[4] += 128
          counts[5] += 32
          counts[6] += 8
          break
      }
      return counts
    },
    {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    }
  )

  const toggleFilter = (id: string, value: string) => {
    const filters = searchParams.getAll('filter')
    const filterKey = `${id}.${value}`
    if (filters.includes(filterKey)) {
      const i = filters.findIndex((f) => f === filterKey)
      filters.splice(i, 1)
    } else {
      filters.push(filterKey)
    }

    searchParams.delete('filter')
    filters.forEach((value) => searchParams.append('filter', value))

    setSearchParams(searchParams)
  }

  const setSortOption = (value: SortValues) => {
    setSearchParams((sp) => {
      sp.set('sort', value)
      return sp
    })
  }

  const setGroupByOption = (value: GroupByValues) => {
    setSearchParams((sp) => {
      sp.set('groupBy', value)
      return sp
    })
  }

  return (
    <div className='bg-gray-50'>
      {/* Mobile filter dialog */}
      <Transition.Root show={mobileFiltersOpen} as={Fragment}>
        <Dialog
          as='div'
          className='relative z-40 sm:hidden'
          onClose={setMobileFiltersOpen}
        >
          <Transition.Child
            as={Fragment}
            enter='transition-opacity ease-linear duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='transition-opacity ease-linear duration-300'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black bg-opacity-25' />
          </Transition.Child>

          <div className='fixed inset-0 z-40 flex'>
            <Transition.Child
              as={Fragment}
              enter='transition ease-in-out duration-300 transform'
              enterFrom='translate-x-full'
              enterTo='translate-x-0'
              leave='transition ease-in-out duration-300 transform'
              leaveFrom='translate-x-0'
              leaveTo='translate-x-full'
            >
              <Dialog.Panel className='relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl'>
                <div className='flex items-center justify-between px-4'>
                  <h2 className='text-lg font-medium text-gray-900'>Filters</h2>
                  <button
                    type='button'
                    className='-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400'
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    <span className='sr-only'>Close menu</span>
                    <XMarkIcon className='h-6 w-6' aria-hidden='true' />
                  </button>
                </div>

                {/* Filters */}
                <form className='mt-4'>
                  {filters.map((section) => (
                    <Disclosure
                      as='div'
                      key={section.name}
                      className='border-t border-gray-200 px-4 py-6'
                    >
                      {({ open }) => (
                        <>
                          <h3 className='-mx-2 -my-3 flow-root'>
                            <Disclosure.Button className='flex w-full items-center justify-between bg-white px-2 py-3 text-sm text-gray-400'>
                              <span className='font-medium text-gray-900'>
                                {section.name}
                              </span>
                              <span className='ml-6 flex items-center'>
                                <ChevronDownIcon
                                  className={clsx(
                                    open ? '-rotate-180' : 'rotate-0',
                                    'h-5 w-5 transform'
                                  )}
                                  aria-hidden='true'
                                />
                              </span>
                            </Disclosure.Button>
                          </h3>
                          <Disclosure.Panel className='pt-6'>
                            <div className='space-y-6'>
                              {section.options.map((option, optionIdx) => (
                                <div
                                  key={option.value}
                                  className='flex items-center'
                                >
                                  <input
                                    id={`filter-mobile-${section.id}-${optionIdx}`}
                                    name={`${section.id}[]`}
                                    defaultValue={option.value}
                                    type='checkbox'
                                    defaultChecked={Boolean(
                                      activeFilters.find(
                                        (f) =>
                                          f.id === section.id &&
                                          f.value === option.value
                                      )
                                    )}
                                    onChange={() =>
                                      toggleFilter(section.id, option.value)
                                    }
                                    className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                                  />
                                  <label
                                    htmlFor={`filter-mobile-${section.id}-${optionIdx}`}
                                    className='ml-3 text-sm text-gray-500'
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  ))}
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <main>
        <div className='bg-white'>
          <div className='mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8'>
            <h1 className='text-3xl font-bold tracking-tight text-gray-900'>
              Mystical Agriculture
            </h1>
            <h3 className='mt-8 text-sm uppercase text-gray-500'>
              Required Materials
            </h3>
            <div className='mt-2 flex flex-row flex-wrap gap-x-6'>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/inferium_essence.png'
                  alt='Inferium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={essenceCounts[1]}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/prudentium_essence.png'
                  alt='Prudentium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={essenceCounts[2]}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/intermedium_essence.png'
                  alt='Intermedium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={essenceCounts[3]}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/superium_essence.png'
                  alt='Superium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={essenceCounts[4]}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/supremium_essence.png'
                  alt='Supremium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={essenceCounts[5]}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/insanium_essence.png'
                  alt='Insanium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={essenceCounts[6]}
                />
              </div>
            </div>
            <div className='jube mt-4 flex flex-row flex-wrap gap-x-6 border-t'>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/inferiumcrystal.png'
                  alt='Inferium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={Math.ceil(essenceCounts[1] / 256)}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/prudentiumcrystal.png'
                  alt='Prudentium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={Math.ceil(essenceCounts[2] / 512)}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/intermediumcrystal.png'
                  alt='Intermedium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={Math.ceil(essenceCounts[3] / 1024)}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/superiumcrystal.png'
                  alt='Superium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={Math.ceil(essenceCounts[4] / 2048)}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/supremiumcrystal.png'
                  alt='Supremium Essence'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={Math.ceil(essenceCounts[5] / 4096)}
                />
              </div>
            </div>
            <div className='jube mt-4 flex flex-row flex-wrap gap-x-6 border-t'>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/seed.png'
                  alt='Seeds'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={filteredIncompleteCrops.length}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/crafting_prosperity_shard.png'
                  alt='Prosperity Shards'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={filteredIncompleteCrops.length * 4}
                />
              </div>
              <div className='mt-2 flex items-center gap-1 text-sm text-gray-600'>
                <img
                  src='/images/diamond.png'
                  alt='Diamonds'
                  className='h-8 w-8 object-cover'
                />
                <NumericFormat
                  displayType='text'
                  thousandsGroupStyle='thousand'
                  thousandSeparator=','
                  value={Math.ceil(essenceCounts[1] / 256)}
                />
              </div>
            </div>
            {/* <p className='mt-4 max-w-xl text-sm text-gray-700'>
              Our thoughtfully designed workspace objects are crafted in limited
              runs. Improve your productivity and organization with these sale
              items before we run out.
            </p> */}
          </div>
        </div>

        {/* Filters */}
        <section aria-labelledby='filter-heading'>
          <h2 id='filter-heading' className='sr-only'>
            Filters
          </h2>

          <div className='border-b border-gray-200 bg-white pb-4'>
            <div className='mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8'>
              <Menu as='div' className='relative inline-block text-left'>
                <div>
                  <Menu.Button className='group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900'>
                    Sort: {sortOption?.name}
                    <ChevronDownIcon
                      className='-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500'
                      aria-hidden='true'
                    />
                  </Menu.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter='transition ease-out duration-100'
                  enterFrom='transform opacity-0 scale-95'
                  enterTo='transform opacity-100 scale-100'
                  leave='transition ease-in duration-75'
                  leaveFrom='transform opacity-100 scale-100'
                  leaveTo='transform opacity-0 scale-95'
                >
                  <Menu.Items className='absolute left-0 z-10 mt-2 w-40 origin-top-left rounded-md bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none'>
                    <div className='py-1'>
                      {sortOptions.map((option) => (
                        <Menu.Item key={option.name}>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                setSortOption(option.value)
                              }}
                              className={clsx(
                                sortOption?.value === option.value
                                  ? 'font-medium text-gray-900'
                                  : 'text-gray-500',
                                active ? 'bg-gray-100' : '',
                                'block w-full px-4 py-2 text-left text-sm'
                              )}
                            >
                              {option.name}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

              <Menu as='div' className='relative ml-4 inline-block text-left'>
                <div>
                  <Menu.Button className='group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900'>
                    Group by: {groupByOption?.name}
                    <ChevronDownIcon
                      className='-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500'
                      aria-hidden='true'
                    />
                  </Menu.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter='transition ease-out duration-100'
                  enterFrom='transform opacity-0 scale-95'
                  enterTo='transform opacity-100 scale-100'
                  leave='transition ease-in duration-75'
                  leaveFrom='transform opacity-100 scale-100'
                  leaveTo='transform opacity-0 scale-95'
                >
                  <Menu.Items className='absolute left-0 z-10 mt-2 w-40 origin-top-left rounded-md bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none'>
                    <div className='py-1'>
                      {groupByOptions.map((option) => (
                        <Menu.Item key={option.name}>
                          {({ active }) => (
                            <button
                              onClick={() => setGroupByOption(option.value)}
                              className={clsx(
                                groupByOption?.value === option.value
                                  ? 'font-medium text-gray-900'
                                  : 'text-gray-500',
                                active ? 'bg-gray-100' : '',
                                'block w-full px-4 py-2 text-left text-sm'
                              )}
                            >
                              {option.name}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

              <button
                type='button'
                className='ml-auto inline-block text-sm font-medium text-gray-700 hover:text-gray-900 sm:hidden'
                onClick={() => setMobileFiltersOpen(true)}
              >
                Filters
              </button>

              <div className='ml-auto hidden sm:block'>
                <div className='flow-root'>
                  <Popover.Group className='-mx-4 flex items-center divide-x divide-gray-200'>
                    {filters.map((section) => (
                      <Popover
                        key={section.name}
                        className='relative inline-block px-4 text-left'
                      >
                        <Popover.Button className='group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900'>
                          <span>{section.name}</span>
                          {activeFilters.some((f) => f.id === section.id) ? (
                            <span className='ml-1.5 rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-gray-700'>
                              {
                                activeFilters.filter((f) => f.id === section.id)
                                  .length
                              }
                            </span>
                          ) : null}
                          <ChevronDownIcon
                            className='-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500'
                            aria-hidden='true'
                          />
                        </Popover.Button>

                        <Transition
                          as={Fragment}
                          enter='transition ease-out duration-100'
                          enterFrom='transform opacity-0 scale-95'
                          enterTo='transform opacity-100 scale-100'
                          leave='transition ease-in duration-75'
                          leaveFrom='transform opacity-100 scale-100'
                          leaveTo='transform opacity-0 scale-95'
                        >
                          <Popover.Panel className='absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white p-4 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none'>
                            <form className='space-y-4'>
                              {section.options.map((option, optionIdx) => (
                                <div
                                  key={option.value}
                                  className='flex items-center'
                                >
                                  <input
                                    id={`filter-${section.id}-${optionIdx}`}
                                    name={`${section.id}[]`}
                                    defaultValue={option.value}
                                    type='checkbox'
                                    defaultChecked={Boolean(
                                      activeFilters.find(
                                        (f) =>
                                          f.id === section.id &&
                                          f.value === option.value
                                      )
                                    )}
                                    onChange={() =>
                                      toggleFilter(section.id, option.value)
                                    }
                                    className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                                  />
                                  <label
                                    htmlFor={`filter-${section.id}-${optionIdx}`}
                                    className='ml-3 whitespace-nowrap pr-6 text-sm font-medium text-gray-900'
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                            </form>
                          </Popover.Panel>
                        </Transition>
                      </Popover>
                    ))}
                  </Popover.Group>
                </div>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {activeFilters.length > 0 && (
            <div className='bg-gray-100'>
              <div className='mx-auto max-w-7xl px-4 py-3 sm:flex sm:items-center sm:px-6 lg:px-8'>
                <h3 className='text-sm font-medium text-gray-500'>
                  Filters
                  <span className='sr-only'>, active</span>
                </h3>

                <div
                  aria-hidden='true'
                  className='hidden h-5 w-px bg-gray-300 sm:ml-4 sm:block'
                />

                <div className='mt-2 sm:ml-4 sm:mt-0'>
                  <div className='-m-1 flex flex-wrap items-center'>
                    {activeFilters.map((activeFilter) => (
                      <span
                        key={activeFilter.value}
                        className='m-1 inline-flex items-center rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-2 text-sm font-medium text-gray-900'
                      >
                        <span>{activeFilter.label}</span>
                        <button
                          type='button'
                          className='ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-500'
                          onClick={() =>
                            toggleFilter(activeFilter.id, activeFilter.value)
                          }
                        >
                          <span className='sr-only'>
                            Remove filter for {activeFilter.label}
                          </span>
                          <XMarkIcon className='h-full w-full' />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* crops grid */}
        <section
          aria-labelledby='crops-heading'
          className='mx-auto max-w-2xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:max-w-7xl lg:px-8'
        >
          <h2 id='crops-heading' className='sr-only'>
            Crops
          </h2>

          <div role='list'>
            {filteredCropGroups.map(({ groupValue, groupName, items }) => (
              <div key={groupValue} className='mb-16'>
                {groupName && (
                  <div className='mb-8 font-semibold'>{groupName}</div>
                )}
                <div className='mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4'>
                  {items.map(({ id, name, image }) => (
                    <button
                      key={id}
                      className={clsx(
                        'col-span-1 flex items-center rounded-md border border-gray-200 bg-white py-2 text-left shadow-sm active:shadow-none',
                        {
                          'opacity-50': session.crops[id],
                        }
                      )}
                      onClick={() => toggleCrop(id)}
                    >
                      <div
                        className={clsx(
                          'flex w-16 flex-shrink-0 items-center justify-center rounded-l-md text-sm font-medium text-white'
                        )}
                      >
                        <img
                          src={`/images/${image}`}
                          className='h-8 w-8 object-cover'
                        />
                      </div>
                      <div className='flex flex-1 items-center justify-between truncate'>
                        <div className='flex-1 truncate text-sm'>
                          <span className='font-medium text-gray-900'>
                            {name}
                          </span>
                          {/* <p className='text-gray-500'>10 Members</p> */}
                        </div>
                        <div className='flex-shrink-0 pr-2 text-black'>
                          {session.crops[id] && (
                            <CheckCircleIcon className='h-6 w-6' />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
