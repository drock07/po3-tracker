import { Fragment } from 'react'
import PageLayout from '../layouts/PageLayout'
import crops from '../data/crops'

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

function Crops() {
  const groupedCrops = groupBy(
    crops,
    (s) => s.tier,
    (tier) => `Tier ${tier}`
  )

  return (
    <PageLayout title='Mystical Agriculture'>
      <table className='w-full'>
        <thead className='sr-only'>
          <tr>
            <th className=''>Name</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200'>
          {groupedCrops.map(({ groupValue, groupName, items }) => (
            <Fragment key={groupValue}>
              <tr className=''>
                <th
                  scope='colgroup'
                  colSpan={1}
                  className='sticky top-0 bg-white bg-opacity-75 py-4 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-3'
                >
                  {groupName}
                </th>
              </tr>
              {items.map(({ id, name, image }) => (
                <tr key={id}>
                  <td className='py-2'>
                    <div className='flex flex-row items-center'>
                      <img
                        src={`/images/${image}`}
                        alt={name}
                        width={16}
                        height={16}
                        className='mr-2 h-8 w-8 object-cover'
                      />
                      <span>{name}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </PageLayout>
  )
}

export default Crops
