import { Outlet, NavLink } from 'react-router-dom'
import { Disclosure } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const user = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
}
const navigation = [
  {
    label: 'Mystical Agriculture',
    to: 'crops',
    image: '/images/inferium_essence.png',
  },
  // { label: 'AE2', to: 'ae2' },
]
const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]

function App() {
  return (
    <>
      <div className='min-h-full'>
        <Disclosure
          as='nav'
          className='sticky top-0 border-b border-gray-200 bg-white'
        >
          {({ open }) => (
            <>
              <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <div className='flex h-16 justify-between'>
                  <div className='flex'>
                    <div className='flex flex-shrink-0 items-center text-lg'>
                      <span className='sm:hidden'>PO3 Tools</span>
                      <span className='hidden sm:inline'>
                        Project Ozone 3 Tools
                      </span>
                    </div>
                    <div className='hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8'>
                      {navigation.map(({ label, to, image }) => (
                        <NavLink
                          key={label}
                          to={to}
                          title={label}
                          className={({ isActive }) =>
                            clsx(
                              'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                              {
                                'border-indigo-500 text-gray-900': isActive,
                                'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700':
                                  !isActive,
                              }
                            )
                          }
                        >
                          <img src={image} alt={label} className='h-8 w-8' />
                        </NavLink>
                      ))}
                    </div>
                  </div>

                  {/* Desktop right stuff */}
                  <div className='hidden sm:ml-6 sm:flex sm:items-center'>
                    {/* This is where the session picker will go */}
                    {/* <Listbox>
                      <Listbox.Button>fart</Listbox.Button>
                      <Listbox.Options>
                        <Listbox.Option value={1}>Session 1</Listbox.Option>
                      </Listbox.Options>
                    </Listbox> */}
                  </div>

                  <div className='-mr-2 flex items-center sm:hidden'>
                    {/* Mobile menu button */}
                    <Disclosure.Button className='inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'>
                      <span className='sr-only'>Open main menu</span>
                      {open ? (
                        <XMarkIcon
                          className='block h-6 w-6'
                          aria-hidden='true'
                        />
                      ) : (
                        <Bars3Icon
                          className='block h-6 w-6'
                          aria-hidden='true'
                        />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className='sm:hidden'>
                <div className='space-y-1 pb-3 pt-2'>
                  {navigation.map(({ label, to, image }) => (
                    <Disclosure.Button
                      key={label}
                      as={NavLink}
                      to={to}
                      title={label}
                      className={({
                        isActive,
                      }: {
                        isActive: boolean
                        isPending: boolean
                      }) => {
                        return clsx(
                          {
                            'border-indigo-500 bg-indigo-50 text-indigo-700':
                              isActive,
                            'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800':
                              !isActive,
                          },
                          'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                        )
                      }}
                    >
                      <img src={image} alt={label} className='h-8 w-8' />
                    </Disclosure.Button>
                  ))}
                </div>
                <div className='border-t border-gray-200 pb-3 pt-4'>
                  <div className='flex items-center px-4'>
                    <div className='flex-shrink-0'>
                      <img
                        className='h-10 w-10 rounded-full'
                        src={user.imageUrl}
                        alt=''
                      />
                    </div>
                    <div className='ml-3'>
                      <div className='text-base font-medium text-gray-800'>
                        {user.name}
                      </div>
                      <div className='text-sm font-medium text-gray-500'>
                        {user.email}
                      </div>
                    </div>
                    <button
                      type='button'
                      className='ml-auto flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                    >
                      <span className='sr-only'>View notifications</span>
                      <BellIcon className='h-6 w-6' aria-hidden='true' />
                    </button>
                  </div>
                  <div className='mt-3 space-y-1'>
                    {userNavigation.map((item) => (
                      <Disclosure.Button
                        key={item.name}
                        as='a'
                        href={item.href}
                        className='block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <div className='py-10'>
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default App
